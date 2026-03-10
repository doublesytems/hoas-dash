/* js/ui.js */

export class UIManager {
    constructor(store, api) {
        this.store = store;
        this.api = api;

        this.currentStates = {};
        this.refreshInterval = null;

        this.screens = {
            config: document.getElementById('config-screen'),
            dashboard: document.getElementById('dashboard-screen')
        };
        this.containers = {
            alerts:    document.getElementById('alert-bar'),
            favorites: document.getElementById('favorites-container'),
            weather:   document.getElementById('weather-container'),
            lights:    document.getElementById('lights-container'),
            sensors:   document.getElementById('sensors-container'),
            climate:   document.getElementById('climate-container'),
            other:     document.getElementById('other-container')
        };

        // Bind methods that are used as callbacks so `this` is preserved
        this.filterModalList = this.filterModalList.bind(this);

        this.setupEventListeners();
    }

    // Sanitize entity_id to a safe DOM id (replace dots and other non-alphanumeric with -)
    safeId(entity_id) {
        return entity_id.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
    }

    svgIcons = {
        light:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
        switch:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
        sensor_temp:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
        sensor_humidity:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
        sensor_energy:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        sensor_generic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        fan:            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-2-8 2-8s5 5 2 8c3 3 8 2 8-2-5-5-8-2-8 2z"/><path d="M12 12c3 3 2 8-2 8s-5-5-2-8c-3-3-8-2-8 2 5 5 8 2 8-2z"/></svg>`,
        weather:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19C19.985 19 22 16.985 22 14.5C22 12.185 20.246 10.283 18 10.046C17.5 7.18 15.008 5 12 5C8.686 5 6 7.686 6 11C3.239 11 1 13.239 1 16C1 18.761 3.239 21 6 21H17.5Z"/></svg>`,
        person_home:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        person_away:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        star:           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        star_filled:    `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        warning:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
    };

    setupEventListeners() {
        document.getElementById('save-config-btn').addEventListener('click', () => {
            const url   = document.getElementById('ha-url').value.trim().replace(/\/$/, '');
            const token = document.getElementById('ha-token').value.trim();
            if (!url || !token) return;
            this.store.saveConfig(url, token);
            this.api = new (this.api.constructor)(url, token);
            this.start();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('active');
            this.startAutoRefresh();
        });

        document.getElementById('save-selection-btn').addEventListener('click', () => {
            this.saveEntitySelection();
        });

        document.getElementById('kiosk-mode-btn').addEventListener('click', () => {
            const isKiosk = this.store.toggleKiosk();
            document.body.classList.toggle('kiosk-mode', isKiosk);
        });

        if (this.store.kioskMode) {
            document.body.classList.add('kiosk-mode');
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopAutoRefresh();
            else this.startAutoRefresh();
        });
    }

    async start() {
        if (!this.store.config.url || !this.store.config.token) {
            this.screens.config.classList.remove('hidden');
            this.screens.dashboard.classList.add('hidden');
            return;
        }

        this.screens.config.classList.add('hidden');
        this.screens.dashboard.classList.remove('hidden');

        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = 'Connecting...';
        statusEl.className = 'status-indicator loading';

        try {
            await this.fetchAndRender(true);
            this.startAutoRefresh();
            statusEl.textContent = 'Live';
            statusEl.className = 'status-indicator live';
        } catch (e) {
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'status-indicator error';
            this.screens.config.classList.remove('hidden');
            this.screens.dashboard.classList.add('hidden');
            const errEl = document.getElementById('config-error');
            errEl.textContent = `Connection failed: ${e.message || 'Check URL and Token.'}`;
            errEl.classList.remove('hidden');
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => this.fetchAndRender(false), 5000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async fetchAndRender(fullRender = false) {
        const states = await this.api.getStates(); // throws on error → caught by caller
        const statesMap = {};
        const alerts = [];

        states.forEach(state => {
            statesMap[state.entity_id] = state;
            this.checkStateForAlerts(state, alerts);
        });

        this.renderAlerts(alerts);

        if (fullRender || Object.keys(this.currentStates).length === 0) {
            this.fullRender(statesMap);
        } else {
            this.patchRender(statesMap);
        }

        this.currentStates = statesMap;
    }

    checkStateForAlerts(state, alerts) {
        if (!this.store.visibleEntities.includes(state.entity_id)) return;

        if (state.state === 'unavailable' || state.state === 'unknown') {
            alerts.push({ msg: `${state.attributes.friendly_name || state.entity_id} is unavailable.` });
        }

        const domain = state.entity_id.split('.')[0];

        if (domain === 'sensor' && state.attributes.device_class === 'temperature') {
            const t = parseFloat(state.state);
            if (!isNaN(t) && t > 30) {
                alerts.push({ msg: `High temperature: ${state.attributes.friendly_name || state.entity_id} is ${t}°C` });
            }
        }

        if (domain === 'binary_sensor' && state.state === 'on') {
            const dc = state.attributes.device_class;
            if (['door', 'window', 'garage_door'].includes(dc)) {
                alerts.push({ msg: `${state.attributes.friendly_name || state.entity_id} is Open!` });
            }
        }
    }

    renderAlerts(alerts) {
        this.containers.alerts.innerHTML = '';
        alerts.forEach(a => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = `${this.svgIcons.warning} ${a.msg}`;
            this.containers.alerts.appendChild(div);
        });
    }

    getIconForEntity(entity) {
        const domain = entity.entity_id.split('.')[0];
        const dc = entity.attributes.device_class;
        if (domain === 'light') return this.svgIcons.light;
        if (domain === 'switch') return this.svgIcons.switch;
        if (domain === 'fan') return this.svgIcons.fan;
        if (domain === 'weather') return this.svgIcons.weather;
        if (domain === 'person' || domain === 'device_tracker')
            return entity.state === 'home' ? this.svgIcons.person_home : this.svgIcons.person_away;
        if (domain === 'sensor') {
            if (dc === 'temperature') return this.svgIcons.sensor_temp;
            if (dc === 'humidity')    return this.svgIcons.sensor_humidity;
            if (dc === 'energy' || dc === 'power') return this.svgIcons.sensor_energy;
        }
        return this.svgIcons.sensor_generic;
    }

    getHighlightClass(entity) {
        const domain = entity.entity_id.split('.')[0];
        const dc     = entity.attributes.device_class;
        const state  = entity.state;
        if (state === 'unavailable' || state === 'unknown') return 'is-warning';
        if (['light', 'switch', 'fan'].includes(domain))    return state === 'on' ? 'is-on' : '';
        if (domain === 'sensor' && dc === 'temperature') {
            const val = parseFloat(state);
            if (!isNaN(val)) {
                if (val > 25) return 'is-danger';
                if (val < 16) return 'is-cold';
            }
        }
        return '';
    }

    formatTime(dateStr) {
        try {
            const d = new Date(dateStr);
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
        } catch { return ''; }
    }

    buildCardHtml(entity) {
        const eid   = entity.entity_id;
        const sid   = this.safeId(eid);          // safe DOM id
        const name  = entity.attributes.friendly_name || eid;
        const state = entity.state;
        const unit  = entity.attributes.unit_of_measurement || '';
        const icon  = this.getIconForEntity(entity);
        const isFav = this.store.favorites.includes(eid);
        const hasChart = eid.startsWith('sensor.') && entity.attributes.state_class === 'measurement';

        return `
            <div class="card-header">
               <div class="card-icon" id="icon-${sid}">${icon}</div>
               <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${eid}" title="Favoriet">
                   ${isFav ? this.svgIcons.star_filled : this.svgIcons.star}
               </button>
            </div>
            <div style="flex:1;"></div>
            <div class="card-value" id="val-${sid}">
                <span id="txt-${sid}">${state}</span>
                <span class="card-unit">${unit}</span>
            </div>
            <div class="card-title" title="${name}">${name}</div>
            <div class="card-time" id="time-${sid}">${this.formatTime(entity.last_updated)}</div>
            ${hasChart ? `<div class="mini-chart" id="chart-${sid}"></div>` : ''}
        `;
    }

    fullRender(statesMap) {
        Object.values(this.containers).forEach(c => { if (c) c.innerHTML = ''; });

        let hasFavs = false, hasWeather = false, hasLights = false,
            hasSensors = false, hasClimate = false, hasOther = false;

        this.store.visibleEntities.forEach(eid => {
            const entity = statesMap[eid];
            if (!entity) return;

            const domain = eid.split('.')[0];
            const isFav  = this.store.favorites.includes(eid);

            const card = document.createElement('div');
            card.id        = `card-${this.safeId(eid)}`;
            card.className = `glass-card ${this.getHighlightClass(entity)}`.trim();

            if (domain === 'weather' && !isFav) {
                // Wide weather card
                card.className = 'glass-card weather-card';
                card.innerHTML = `
                    <div class="card-icon" style="width:48px;height:48px;">${this.svgIcons.weather}</div>
                    <div>
                        <div class="card-title">${entity.attributes.friendly_name || eid}</div>
                        <div class="card-value">${entity.attributes.temperature ?? ''} ${entity.attributes.temperature_unit ?? ''}</div>
                        <div style="font-size:0.8rem;color:var(--text-secondary);">
                            ${entity.state} &nbsp;|&nbsp; Vochtigheid: ${entity.attributes.humidity ?? 0}% &nbsp;|&nbsp; Wind: ${entity.attributes.wind_speed ?? 0}
                        </div>
                    </div>
                `;
                this.containers.weather.appendChild(card);
                hasWeather = true;
                return;
            }

            card.innerHTML = this.buildCardHtml(entity);

            card.querySelector('.fav-btn').addEventListener('click', e => {
                e.stopPropagation();
                this.store.toggleFavorite(eid);
                this.fullRender(this.currentStates);
            });

            if (isFav) {
                this.containers.favorites.appendChild(card);
                hasFavs = true;
            } else if (domain === 'light' || domain === 'switch') {
                this.containers.lights.appendChild(card);
                hasLights = true;
            } else if (domain === 'sensor' || domain === 'binary_sensor' || domain === 'person' || domain === 'device_tracker') {
                this.containers.sensors.appendChild(card);
                hasSensors = true;
            } else if (domain === 'fan' || domain === 'climate') {
                this.containers.climate.appendChild(card);
                hasClimate = true;
            } else {
                this.containers.other.appendChild(card);
                hasOther = true;
            }
        });

        document.getElementById('section-favorites').style.display = hasFavs    ? 'flex' : 'none';
        document.getElementById('section-weather').style.display   = hasWeather ? 'flex' : 'none';
        document.getElementById('section-lights').style.display    = hasLights  ? 'flex' : 'none';
        document.getElementById('section-sensors').style.display   = hasSensors ? 'flex' : 'none';
        document.getElementById('section-climate').style.display   = hasClimate ? 'flex' : 'none';
        document.getElementById('section-other').style.display     = hasOther   ? 'flex' : 'none';

        setTimeout(() => this.loadCharts(statesMap), 600);
    }

    patchRender(statesMap) {
        this.store.visibleEntities.forEach(eid => {
            const entity    = statesMap[eid];
            const oldEntity = this.currentStates[eid];
            if (!entity || !oldEntity) return;
            if (entity.state === oldEntity.state && entity.last_updated === oldEntity.last_updated) return;

            const sid  = this.safeId(eid);
            const card = document.getElementById(`card-${sid}`);
            if (!card) return;

            card.className = `glass-card ${this.getHighlightClass(entity)}`.trim();

            const txtEl  = document.getElementById(`txt-${sid}`);
            const timeEl = document.getElementById(`time-${sid}`);
            if (txtEl)  txtEl.textContent  = entity.state;
            if (timeEl) timeEl.textContent = this.formatTime(entity.last_updated);

            const domain = eid.split('.')[0];
            if (domain === 'person' || domain === 'device_tracker') {
                const iconEl = document.getElementById(`icon-${sid}`);
                if (iconEl) iconEl.innerHTML = this.getIconForEntity(entity);
            }
        });
    }

    async loadCharts(statesMap) {
        for (const eid of this.store.visibleEntities) {
            const entity = statesMap[eid];
            if (!entity || entity.attributes.state_class !== 'measurement') continue;

            const sid  = this.safeId(eid);
            const chartEl = document.getElementById(`chart-${sid}`);
            if (!chartEl) continue;

            try {
                const historyWrapper = await this.api.getHistory(eid, 24);
                if (historyWrapper && historyWrapper.length > 0) {
                    this.drawSparkline(chartEl, historyWrapper[0]);
                }
            } catch {
                // silent
            }
        }
    }

    drawSparkline(container, data) {
        const pts = data.map(d => parseFloat(d.state)).filter(v => !isNaN(v));
        if (pts.length < 2) return;

        const min = Math.min(...pts);
        const max = Math.max(...pts);
        const range = max - min || 1;
        const W = 200, H = 40;
        const stepX = W / (pts.length - 1);

        const pathData = pts.map((val, i) => {
            const x = i * stepX;
            const y = H - ((val - min) / range) * H * 0.8 - H * 0.1;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        container.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
                <path d="${pathData}" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    }

    openSettingsModal() {
        this.stopAutoRefresh();
        const listDiv = document.getElementById('entity-selection-list');
        listDiv.innerHTML = '';

        const allEntities = Object.values(this.currentStates).sort((a, b) => {
            const dA = a.entity_id.split('.')[0], dB = b.entity_id.split('.')[0];
            if (dA !== dB) return dA.localeCompare(dB);
            return (a.attributes.friendly_name || a.entity_id)
                .localeCompare(b.attributes.friendly_name || b.entity_id);
        });

        allEntities.forEach(entity => {
            const domain    = entity.entity_id.split('.')[0];
            const isChecked = this.store.visibleEntities.includes(entity.entity_id);
            const name      = entity.attributes.friendly_name || entity.entity_id;
            const sid       = this.safeId(entity.entity_id);

            const div = document.createElement('div');
            div.className = 'entity-list-item';
            div.innerHTML = `
                <input type="checkbox" id="chk-${sid}" value="${entity.entity_id}" ${isChecked ? 'checked' : ''}>
                <label for="chk-${sid}" style="cursor:pointer;flex:1;">${name}</label>
                <div class="status-badge">${domain}</div>
            `;
            listDiv.appendChild(div);
        });

        document.getElementById('settings-modal').classList.add('active');

        // Rebind search and filter chips cleanly
        const searchEl = document.getElementById('modal-search');
        searchEl.value = '';
        searchEl.removeEventListener('input', this.filterModalList);
        searchEl.addEventListener('input', this.filterModalList);

        document.querySelectorAll('.filter-chip').forEach(chip => {
            const cloned = chip.cloneNode(true);
            chip.replaceWith(cloned);
            cloned.addEventListener('click', e => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                cloned.classList.add('active');
                this.filterModalList();
            });
        });
    }

    filterModalList() {
        const query       = (document.getElementById('modal-search')?.value || '').toLowerCase();
        const activeChip  = document.querySelector('.filter-chip.active');
        const domainFilter = activeChip ? activeChip.dataset.domain : 'all';

        document.querySelectorAll('#entity-selection-list .entity-list-item').forEach(item => {
            const lbl    = item.querySelector('label')?.textContent?.toLowerCase() || '';
            const type   = item.querySelector('.status-badge')?.textContent || '';
            const show   = lbl.includes(query) && (domainFilter === 'all' || type === domainFilter);
            item.style.display = show ? 'flex' : 'none';
        });
    }

    saveEntitySelection() {
        const selected = [];
        document.querySelectorAll('#entity-selection-list input[type="checkbox"]').forEach(inp => {
            if (inp.checked) selected.push(inp.value);
        });
        this.store.saveVisibleEntities(selected);
        document.getElementById('settings-modal').classList.remove('active');
        this.fullRender(this.currentStates);
        this.startAutoRefresh();
    }
}
