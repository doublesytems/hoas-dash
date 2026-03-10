# Home Assistant Dashboard

A fast, mobile-friendly **read-only** web dashboard for Home Assistant. Connects to the Home Assistant REST API and displays entities in a sleek glassmorphism dark mode design.

## ✨ Features

- 🔌 **Connect via Home Assistant URL + Long-Lived Access Token**
- 🌡️ **Comprehensive Entity Support** — temperature sensors, humidity, energy, lights, switches, fans, and more
- ⭐ **Favorites** — mark entities to pin them to the top of the dashboard
- 👁️ **Visibility Control** — choose exactly which entities to show (saved in localStorage)
- 🔍 **Advanced Filtering** — search functionality + domain filters in the entity selector
- 📉 **Mini Charts** — sparklines for sensors (last 24 hours via HA History API)
- ⚠️ **Alert Bar** — instant notifications for unavailable devices, open doors, or high temperatures
- ☀️ **Weather Card** — dedicated display if a `weather.*` entity is selected
- 📱 **Tablet/Kiosk Mode** — fullscreen layout with larger cards and hidden header for wall-mounted displays
- 💾 **Backup & Restore** — export and import your dashboard configuration (URL, Token, visibility, favorites) as a JSON file
- 🚫 **Pure Monitoring** — read-only interface; no accidental device control
- 🔄 **Auto-refresh** — updates every 5 seconds with tab visibility optimization
- 🌙 **Glassmorphism Design** — modern, high-performance UI with CSS blur effects

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
2. Enter your **Home Assistant URL** and a **Long-Lived Access Token**
3. Click **Connect**
4. Click the **gear icon** ⚙️ in the top right:
    - Toggle **Visibility** for the entities you want to display
    - Use **Export** to save your configuration for another device
    - Use **Import** to restore settings from a backup file
5. Use the **star icon** on cards to pin entities to your Favorites section

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

If you host the dashboard on a different IP/domain than your HA server, you must add the following to your `configuration.yaml` and **restart Home Assistant**:

```yaml
http:
  cors_allowed_origins:
    - http://<YOUR-DASHBOARD-IP>
    - http://localhost:8080   # If testing locally
```

## 🛠️ Technology Stack

- Vanilla HTML, CSS, JavaScript (ES Modules)
- Glassmorphism design using CSS Custom Properties
- Home Assistant REST API + History API
- Zero external dependencies or frameworks
