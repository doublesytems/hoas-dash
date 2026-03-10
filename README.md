# Home Assistant Dashboard

Een snelle, mobiel-vriendelijke **read-only** web dashboard voor Home Assistant. Verbindt met de Home Assistant REST API en toont entiteiten in een strak glassmorphism dark mode ontwerp.

## ✨ Functies

- 🔌 Verbinding via Home Assistant URL + Long-Lived Access Token
- 🌡️ Temperatuursensoren, vochtigheid, energie, lampen, schakelaars, ventilatoren en meer
- ⭐ Favorieten — markeer entiteiten en zet ze bovenaan het dashboard
- 👁️ Zelf kiezen welke entiteiten zichtbaar zijn (opgeslagen in localStorage)
- 🔍 Zoekfunctie + filter op domein in de entity-selector
- 📈 Mini grafieken op sensoren (laatste 24 uur via HA History API)
- ⚠️ Alertbalk voor onbeschikbare apparaten, open deuren, hoge temperaturen
- ☀️ Weerkaart als er een `weather.*` entiteit aanwezig is
- 📱 Tablet/Kiosk modus — volledig scherm zonder header, grote kaarten
- 🚫 Puur weergave (read-only) — geen bediening van apparaten
- 🔄 Auto-refresh elke 5 seconden
- ⏸️ Pauzeren bij inactief tabblad (performance optimalisatie)
- 🌙 Glassmorphism dark mode design

## 📁 Projectstructuur

```
hoas-dash/
├── index.html          # Hoofd HTML layout
├── css/
│   └── main.css        # Styling (glassmorphism, dark mode, grid)
├── js/
│   ├── app.js          # Startpunt (laadt modules)
│   ├── api.js          # Home Assistant REST API laag
│   ├── store.js        # Persistente opslag (localStorage)
│   └── ui.js           # UI beheer, kaarten, modals, grafieken
├── proxmox-install.sh  # Geautomatiseerd installatiescript voor Proxmox
└── README.md
```

## 🚀 Gebruik

1. Open `index.html` via een lokale webserver (bijv. `npx serve`)
2. Voer je Home Assistant URL en een Long-Lived Access Token in
3. Klik op **Connect**
4. Klik op het **tandwiel** ⚙️ rechtsboven om te selecteren welke entiteiten je wilt zien
5. Gebruik het **ster-icoontje** op kaarten om entiteiten als favoriet te markeren

> **Let op:** Entiteiten zijn standaard verborgen. Je moet ze handmatig aanzetten via het instellingen-tandwiel.

## 🖥️ Installatie via Proxmox LXC (Geautomatiseerd)

Installeer dit dashboard in één commando als lichte Alpine Linux container op je Proxmox server.

Open de **Shell** van je Proxmox Node en voer uit:

```bash
wget -O- https://raw.githubusercontent.com/doublesytems/hoas-dash/main/proxmox-install.sh | bash
```

Wanneer het script klaar is, toont het het IP-adres waarop het dashboard bereikbaar is.

### Dashboard updaten na een GitHub push

```bash
pct exec <Container-ID> -- sh -c "cd /var/www/localhost/htdocs && git reset --hard origin/main && git pull"
```

## 🔑 Token aanmaken

Ga in Home Assistant naar **Profiel → Long-Lived Access Tokens → Create Token** en kopieer de gegenereerde sleutel.

## 🌐 Home Assistant CORS configuratie

Als je het dashboard op een ander adres dan je HA server host, voeg dan het volgende toe aan `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - http://<IP-VAN-JE-DASHBOARD>
```

Herstart daarna Home Assistant.

## 🛠️ Technologie

- Vanilla HTML, CSS, JavaScript (ES Modules)
- Glassmorphism design met CSS custom properties
- Home Assistant REST API + History API
- Geen externe dependencies of frameworks nodig
