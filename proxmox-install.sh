#!/bin/bash

echo "=========================================="
echo " Home Assistant Dashboard LXC Installer"
echo "=========================================="

# Stop bij errors
set -e

# Controleer root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Run dit script als root op de Proxmox host."
  exit 1
fi

# Config
STORAGE="local-lvm"
HOSTNAME="hoas-dash"
DISK_SIZE="2"

# Next container ID
CTID=$(pvesh get /cluster/nextid)

echo "-> Container ID: $CTID"

echo "-> Updating template list..."
pveam update >/dev/null

# Zoek nieuwste Alpine template
TEMPLATE=$(pveam available -section system | awk '/alpine.*default/ {print $2}' | sort -V | tail -n 1)

if [ -z "$TEMPLATE" ]; then
  echo "❌ Geen Alpine template gevonden"
  exit 1
fi

echo "-> Downloading template $TEMPLATE"
pveam download local $TEMPLATE >/dev/null

FULL_TEMPLATE="local:vztmpl/$(basename $TEMPLATE)"

echo "-> Creating container..."

pct create $CTID $FULL_TEMPLATE \
  --hostname $HOSTNAME \
  --arch amd64 \
  --cores 1 \
  --memory 128 \
  --swap 0 \
  --rootfs $STORAGE:$DISK_SIZE \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --ostype alpine \
  --features nesting=1

echo "-> Starting container..."
pct start $CTID

# Wait for container to stabilize
sleep 2

echo "-> Installing packages..."

pct exec $CTID -- sh -c "
apk update
apk add lighttpd git
"

echo "-> Installing dashboard..."

pct exec $CTID -- sh -c "
rm -rf /var/www/localhost/htdocs
git clone https://github.com/doublesytems/hoas-dash.git /var/www/localhost/htdocs
"

echo "-> Enabling webserver..."

pct exec $CTID -- sh -c "
rc-update add lighttpd default
rc-service lighttpd start
"

echo "-> Waiting for IP..."

IP=""
for i in {1..30}; do
  IP=$(pct exec $CTID -- ip -4 addr show eth0 | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)
  if [ -n "$IP" ]; then
    break
  fi
  sleep 2
done

echo ""
echo "=========================================="
if [ -n "$IP" ]; then
  echo "✅ Dashboard Container Ready"
  echo "Container ID: $CTID"
  echo "Dashboard URL:"
  echo "http://$IP"
else
  echo "⚠️  Container Created (IP not assigned yet)"
  echo "Container ID: $CTID"
  echo "Check IP manually with: pct exec $CTID -- ip -4 addr show eth0"
fi
echo "=========================================="