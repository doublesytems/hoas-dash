#!/bin/bash
# Run this script directly on your Proxmox Host shell (node shell)
# It creates a lightweight Alpine Linux LXC, installs a webserver, and downloads your dashboard.

echo "=========================================="
echo " Setting up Home Assistant Dashboard LXC"
echo "=========================================="

# Get the next available Container ID
CTID=$(pvesh get /cluster/nextid)

echo "-> Chosen Container ID: $CTID"

# Update Proxmox container templates
echo "-> Updating Proxmox templates list..."
pveam update >/dev/null

# Find the latest Alpine Linux template
TEMPLATE=$(pveam available -section system | grep alpine | grep default | sort -V | tail -n 1 | awk '{print $2}')

if [ -z "$TEMPLATE" ]; then
    echo "❌ Error: Could not find an Alpine Linux template."
    exit 1
fi

echo "-> Downloading template: $TEMPLATE"
pveam download local $TEMPLATE >/dev/null

STORAGE="local-lvm" # Adjust this if you use another storage pool like 'local-zfs'
FULL_TEMPLATE_NAME="local:vztmpl/$(basename $TEMPLATE)"

echo "-> Creating LXC Container..."
pct create $CTID $FULL_TEMPLATE_NAME \
  --arch amd64 \
  --hostname hoas-dash \
  --cores 1 \
  --memory 128 \
  --swap 0 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage $STORAGE \
  --unprivileged 1 \
  --ostype alpine

echo "-> Starting Container..."
pct start $CTID

echo "-> Waiting for network to initialize..."
sleep 5

echo "-> Installing Web Server (lighttpd) and Git..."
pct exec $CTID -- apk update
pct exec $CTID -- apk add lighttpd git

echo "-> Downloading Dashboard from GitHub..."
pct exec $CTID -- rm -rf /var/www/localhost/htdocs
pct exec $CTID -- git clone https://github.com/doublesytems/hoas-dash.git /var/www/localhost/htdocs

echo "-> Starting Web Server..."
pct exec $CTID -- rc-update add lighttpd default
pct exec $CTID -- rc-service lighttpd start

# Get the IP address
IP=$(pct exec $CTID -- ip -4 addr show eth0 | awk '/inet / {print $2}' | cut -d/ -f1 | head -n 1)

echo ""
echo "==========================================================="
echo "✅ LXC Container Created Successfully!"
echo "🌐 Je dashboard is nu te bereiken op: http://$IP"
echo "🆔 Proxmox Container ID: $CTID"
echo "==========================================================="
