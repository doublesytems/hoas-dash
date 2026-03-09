# Home Assistant Dashboard

Een moderne, mobiel-vriendelijke web dashboard voor Home Assistant. Verbindt met de Home Assistant REST API en toont sensoren, lampen, schakelaars en ventilatoren in een strak kaart-gebaseerd overzicht.

## Functies

- 🔌 Verbinding via Home Assistant URL + Long-Lived Access Token
- 🌡️ Temperatuursensoren, lampen, schakelaars en ventilatoren weergeven
- 👁️ Zelf selecteren welke entities zichtbaar zijn (gesaved in localStorage)
- 🔍 Zoekfunctie in de entity-selectie
- 🚫 Puur weergave (read-only) — geen bediening
- 🔄 Auto-refresh elke 5 seconden
- 🌙 Glassmorphism dark mode design

## Gebruik

1. Open `index.html` via een lokale webserver (bijv. `npx serve`)
2. Voer je Home Assistant URL en een Long-Lived Access Token in
3. Klik op **Connect**
4. Gebruik het **oogje** rechtsboven om te selecteren welke entities je wilt zien

## Home Assistant CORS configuratie

Voeg het volgende toe aan je `configuration.yaml` als je het dashboard lokaal host:

```yaml
http:
  cors_allowed_origins:
    - http://localhost:8080
    - http://127.0.0.1:8080
```

Herstart daarna Home Assistant.

## Token aanmaken

Ga in Home Assistant naar **Profiel → Long-Lived Access Tokens → Create Token**.

## Technologie

- Vanilla HTML, CSS, JavaScript
- Glassmorphism design met CSS custom properties
- Home Assistant REST API
