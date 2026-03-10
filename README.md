# Home Assistant Dashboard

A fast, mobile-friendly **read-only** web dashboard for Home Assistant. Connects to the Home Assistant REST API and displays entities in a sleek glassmorphism dark mode design.

## ✨ Features

- 🔌 Connect via Home Assistant URL + Long-Lived Access Token
- 🌡️ Support for temperature sensors, humidity, energy, lights, switches, fans, and more
- ⭐ Favorites — mark entities to pin them to the top of the dashboard
- 👁️ Visibility Control — choose which entities to show (saved in localStorage)
- 🔍 Search functionality + domain filters in the entity selector
- 📈 Mini Charts for sensors (last 24 hours via HA History API)
- ⚠️ Alert Bar for unavailable devices, open doors, or high temperatures
- ☀️ Weather Card — dedicated display if a `weather.*` entity is selected
- 📱 Tablet/Kiosk Mode — fullscreen layout with larger cards and hidden header
- 🚫 Pure Monitoring (read-only) — no device control for maximum safety
- 🔄 Auto-refresh every 5 seconds
- ⏸️ Tab Visibility Handling — pauses updates when the tab is inactive
- 🌙 Glassmorphism Dark Mode design with modern CSS effects

## 📁 Project Structure

```
hoas-dash/
├── index.html          # Main HTML layout
├── css/
│   └── main.css        # Styling (glassmorphism, dark mode, grid)
├── js/
│   ├── app.js          # Entry point (module loader)
│   ├── api.js          # Home Assistant REST API layer
│   ├── store.js        # Persistence layer (localStorage)
│   └── ui.js           # UI logic, card rendering, modals, charts
├── proxmox-install.sh  # Automated installation script for Proxmox
└── README.md
```

## 🚀 Getting Started

1. Open `index.html` through a local web server (e.g., `npx serve`)
2. Enter your Home Assistant URL and a Long-Lived Access Token
3. Click **Connect**
4. Click the **gear icon** ⚙️ in the top right to select which entities you want to display
5. Use the **star icon** on cards to mark entities as favorites

> **Note:** All entities are hidden by default. Use the settings menu to toggle visibility for the ones you need.

## 🖥️ Proxmox LXC Installation (Automated)

Deploy this dashboard with a single command as a lightweight Alpine Linux container on your Proxmox server.

Open the **Shell** of your Proxmox Node and run:

```bash
wget -O- https://raw.githubusercontent.com/doublesytems/hoas-dash/main/proxmox-install.sh | bash
```

Once the script completes, it will display the IP address where your dashboard is accessible.

### Updating the Dashboard after a GitHub push

```bash
pct exec <Container-ID> -- sh -c "cd /var/www/localhost/htdocs && git reset --hard origin/main && git pull"
```

## 🔑 Creating a Token

In Home Assistant, go to **Profile → Long-Lived Access Tokens → Create Token** and copy the generated key.

## 🌐 Home Assistant CORS Configuration

If you host the dashboard on a different IP/domain than your HA server, you must add the following to your `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - http://<YOUR-DASHBOARD-IP>
```

Restart Home Assistant after making these changes.

## 🛠️ Technology Stack

- Vanilla HTML, CSS, JavaScript (ES Modules)
- Glassmorphism design using CSS Custom Properties
- Home Assistant REST API + History API
- No external dependencies or frameworks required
