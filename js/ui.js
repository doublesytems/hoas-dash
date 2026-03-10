/* js/ui.js */

export class UIManager {
    constructor(store, api) {
        this.store = store;
        this.api = api;
        
        // Caches and states
        this.currentStates = {};
        this.refreshInterval = null;
        
        // DOM Elements
        this.screens = {
            config: document.getElementById('config-screen'),
            dashboard: document.getElementById('dashboard-screen')
        };
        this.containers = {
            alerts: document.getElementById('alert-bar'),
            favorites: document.getElementById('favorites-container'),
            weather: document.getElementById('weather-container'),
            lights: document.getElementById('lights-container'),
            sensors: document.getElementById('sensors-container'),
            climate: document.getElementById('climate-container'),
            other: document.getElementById('other-container') // For switches, etc.
        };
        
        this.setupEventListeners();
    }

    svgIcons = {
        light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
        switch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
        sensor_temp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
        sensor_humidity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
        sensor_energy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
        sensor_generic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        fan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-2-8 2-8s5 5 2 8c3 3 8 2 8-2-5-5-8-2-8 2z"/><path d="M12 12c3 3 2 8-2 8s-5-5-2-8c-3-3-8-2-8 2 5 5 8 2 8-2z"/></svg>`,
        weather: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19C19.985 19 22 16.985 22 14.5C22 12.185 20.246 10.283 18 10.046C17.5 7.18 15.008 5 12 5C8.686 5 6 7.686 6 11C3.239 11 1 13.239 1 16C1 18.761 3.239 21 6 21H17.5Z"/></svg>`,
        person_home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        person_away: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        star_filled: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
    };

    setupEventListeners() {
        document.getElementById('save-config-btn').addEventListener('click', () => {
            const url = document.getElementById('ha-url').value;
            const token = document.getElementById('ha-token').value;
            if(!url || !token) return;
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

        if(this.store.kioskMode) {
             document.body.classList.add('kiosk-mode');
        }

        // Tab Visibility handling for performance
        document.addEventListener("visibilitychange", () => {
             if (document.hidden) {
                  this.stopAutoRefresh();
             } else {
                  this.startAutoRefresh();
             }
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
        
        document.getElementById('connection-status').textContent = 'Connecting...';
        document.getElementById('connection-status').className = 'status-indicator loading';

        try {
            await this.fetchAndRender(true);
            this.startAutoRefresh();
            document.getElementById('connection-status').textContent = 'Live';
            document.getElementById('connection-status').className = 'status-indicator live';
        } catch(e) {
            document.getElementById('connection-status').textContent = 'Disconnected';
            document.getElementById('connection-status').className = 'status-indicator error';
            this.screens.config.classList.remove('hidden');
            this.screens.dashboard.classList.add('hidden');
            document.getElementById('config-error').textContent = 'Connection failed. Check URL and Token.';
            document.getElementById('config-error').classList.remove('hidden');
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
        try {
            const states = await this.api.getStates();
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
        } catch(e) {
            console.error("Fetch failed", e);
            throw e;
        }
    }

    checkStateForAlerts(state, alerts) {
        if (!this.store.visibleEntities.includes(state.entity_id)) return;
        
        if (state.state === 'unavailable' || state.state === 'unknown') {
            alerts.push({ id: state.entity_id, msg: `${state.attributes.friendly_name || state.entity_id} is unavailable.` });
        }
        
        const domain = state.entity_id.split('.')[0];
        
        // Example logic for high temp alert
        if (domain === 'sensor' && state.attributes.device_class === 'temperature') {
             const t = parseFloat(state.state);
             if (!isNaN(t) && t > 30) {
                  alerts.push({ id: state.entity_id, msg: `High temperature in ${state.attributes.friendly_name || state.entity_id}: ${t}°C` });
             }
        }

        // Example logic for doors/windows
        if (domain === 'binary_sensor' && state.state === 'on') {
            const dc = state.attributes.device_class;
            if (['door', 'window', 'garage_door'].includes(dc)) {
                 alerts.push({ id: state.entity_id, msg: `${state.attributes.friendly_name || state.entity_id} is Open!` });
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
        if (domain === 'person' || domain === 'device_tracker') return entity.state === 'home' ? this.svgIcons.person_home : this.svgIcons.person_away;
        
        if (domain === 'sensor') {
            if (dc === 'temperature') return this.svgIcons.sensor_temp;
            if (dc === 'humidity') return this.svgIcons.sensor_humidity;
            if (dc === 'energy' || dc === 'power') return this.svgIcons.sensor_energy;
            return this.svgIcons.sensor_generic;
        }
        return this.svgIcons.sensor_generic;
    }

    getHighlightClass(entity) {
        const domain = entity.entity_id.split('.')[0];
        const dc = entity.attributes.device_class;
        const state = entity.state;

        if (state === 'unavailable' || state === 'unknown') return 'is-warning';
        if (domain === 'light' || domain === 'switch' || domain === 'fan') {
            return state === 'on' ? 'is-on' : '';
        }
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
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        } catch { return ''; }
    }

    buildCardHtml(entity) {
        const id = entity.entity_id;
        const name = entity.attributes.friendly_name || id;
        const stateStr = entity.state;
        const unit = entity.attributes.unit_of_measurement || '';
        const icon = this.getIconForEntity(entity);
        const isFav = this.store.favorites.includes(id);

        let valueDisplay = `<div class="card-value" id="val-${id}"><span id="txt-${id}">${stateStr}</span> <span class="card-unit">${unit}</span></div>`;

        return `
            <div class="card-header">
               <div class="card-icon" id="icon-${id}">${icon}</div>
               <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${id}" title="Toggle Favorite">
                   ${isFav ? this.svgIcons.star_filled : this.svgIcons.star}
               </button>
            </div>
            <div style="flex:1;"></div>
            ${valueDisplay}
            <div class="card-title" title="${name}">${name}</div>
            <div class="card-time" id="time-${id}">${this.formatTime(entity.last_updated)}</div>
            ${entity.entity_id.startsWith('sensor.') && entity.attributes.state_class === 'measurement' ? `<div class="mini-chart" id="chart-${id}"></div>` : ''}
        `;
    }

    fullRender(statesMap) {
        // Clear all containers
        Object.values(this.containers).forEach(c => {
             if(c) c.innerHTML = '';
        });

        // Track what we rendered so we hide empty sections
        let hasFavs = false, hasWeather = false, hasLights = false, hasSensors = false, hasClimate = false, hasOther = false;

        const visibleIds = this.store.visibleEntities;
        
        visibleIds.forEach(id => {
            const entity = statesMap[id];
            if(!entity) return;

            const domain = id.split('.')[0];
            const isFav = this.store.favorites.includes(id);

            const card = document.createElement('div');
            card.className = `glass-card ${this.getHighlightClass(entity)} hide-scrollbar`;
            card.id = `card-${id}`;
            card.innerHTML = this.buildCardHtml(entity);

            // Add listener for favorite toggle
            card.querySelector('.fav-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.store.toggleFavorite(id);
                this.fullRender(this.currentStates); // Re-render to move to fav section
            });

            if (isFav) {
                this.containers.favorites.appendChild(card);
                hasFavs = true;
            } else if (domain === 'weather') {
                // Special layout for weather
                card.className = 'glass-card weather-card';
                card.innerHTML = `
                    <div class="card-icon" style="width:48px; height:48px;">${this.svgIcons.weather}</div>
                    <div>
                         <div class="card-title">${entity.attributes.friendly_name || id}</div>
                         <div class="card-value">${entity.attributes.temperature || ''} ${entity.attributes.temperature_unit || ''}</div>
                         <div style="font-size: 0.8rem; color: var(--text-secondary);">${entity.state} | Hum: ${entity.attributes.humidity || 0}% | Wind: ${entity.attributes.wind_speed || 0}</div>
                    </div>
                `;
                this.containers.weather.appendChild(card);
                hasWeather = true;
            } else if (domain === 'light') {
                this.containers.lights.appendChild(card);
                hasLights = true;
            } else if (domain === 'sensor' || domain === 'binary_sensor' || domain === 'person') {
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

        // Hide empty sections
        document.getElementById('section-favorites').style.display = hasFavs ? 'flex' : 'none';
        document.getElementById('section-weather').style.display = hasWeather ? 'flex' : 'none';
        document.getElementById('section-lights').style.display = hasLights ? 'flex' : 'none';
        document.getElementById('section-sensors').style.display = hasSensors ? 'flex' : 'none';
        document.getElementById('section-climate').style.display = hasClimate ? 'flex' : 'none';
        document.getElementById('section-other').style.display = hasOther ? 'flex' : 'none';

        // Load charts dynamically
        setTimeout(() => this.loadCharts(statesMap), 500);
    }

    patchRender(statesMap) {
        const visibleIds = this.store.visibleEntities;
        visibleIds.forEach(id => {
            const entity = statesMap[id];
            const oldEntity = this.currentStates[id];
            if(!entity || !oldEntity) return;

            if (entity.state !== oldEntity.state || entity.last_updated !== oldEntity.last_updated) {
                const card = document.getElementById(`card-${id}`);
                if (card) {
                    card.className = `glass-card ${this.getHighlightClass(entity)} hide-scrollbar`;
                    
                    if (entity.entity_id.startsWith('weather.')) {
                          // update weather specific
                          // simplified for patching
                          return;
                    }

                    const valEl = document.getElementById(`txt-${id}`);
                    if(valEl) valEl.textContent = entity.state;

                    const timeEl = document.getElementById(`time-${id}`);
                    if(timeEl) timeEl.textContent = this.formatTime(entity.last_updated);

                    // Dynamic Icon changes for Person
                    const domain = id.split('.')[0];
                    if(domain === 'person' || domain === 'device_tracker') {
                         const iconEl = document.getElementById(`icon-${id}`);
                         if(iconEl) iconEl.innerHTML = this.getIconForEntity(entity);
                    }
                }
            }
        });
    }

    async loadCharts(statesMap) {
         const visibleIds = this.store.visibleEntities;
         for (let i = 0; i < visibleIds.length; i++) {
              const id = visibleIds[i];
              const entity = statesMap[id];
              if(!entity) continue;

              const chartContainer = document.getElementById(`chart-${id}`);
              if(chartContainer && entity.attributes.state_class === 'measurement') {
                   try {
                       const historyWrapper = await this.api.getHistory(id, 24);
                       if(historyWrapper && historyWrapper.length > 0) {
                            const history = historyWrapper[0];
                            this.drawSparkline(chartContainer, history);
                       }
                   } catch(e) {
                       // ignore chart failure silently
                   }
              }
         }
    }

    drawSparkline(container, data) {
         if(!data || data.length < 2) return;
         
         // extract numeric values
         let pts = [];
         data.forEach(d => {
              const val = parseFloat(d.state);
              if(!isNaN(val)) pts.push(val);
         });

         if(pts.length < 2) return;

         const min = Math.min(...pts);
         const max = Math.max(...pts);
         const range = max - min || 1; // avoid / 0

         const width = 200; // SVB viewport width
         const height = 40; // SVG viewport height
         
         const stepX = width / (pts.length - 1);
         
         let pathData = pts.map((val, idx) => {
              const x = idx * stepX;
               // SVG coords: 0,0 is top left. Invert Y.
              const norm = (val - min) / range;
              const y = height - (norm * height * 0.8) - (height * 0.1); // 10% vertical padding
              return `${idx===0?'M':'L'} ${x},${y}`;
         }).join(' ');

         const svg = `
            <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
               <path d="${pathData}" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
         `;
         container.innerHTML = svg;
    }

    // Modal UI Logc
    openSettingsModal() {
        this.stopAutoRefresh();
        const m = document.getElementById('settings-modal');
        const listDiv = document.getElementById('entity-selection-list');
        listDiv.innerHTML = '';

        // Sort entities
        const allEntities = Object.values(this.currentStates).sort((a,b) => {
             const dA = a.entity_id.split('.')[0];
             const dB = b.entity_id.split('.')[0];
             if (dA !== dB) return dA.localeCompare(dB);
             return (a.attributes.friendly_name||a.entity_id).localeCompare(b.attributes.friendly_name||b.entity_id);
        });

        allEntities.forEach(entity => {
            const domain = entity.entity_id.split('.')[0];
            const isChecked = this.store.visibleEntities.includes(entity.entity_id);
            const name = entity.attributes.friendly_name || entity.entity_id;

            const div = document.createElement('div');
            div.className = 'entity-list-item';
            div.innerHTML = `
                <input type="checkbox" id="chk-${entity.entity_id}" value="${entity.entity_id}" ${isChecked?'checked':''}>
                <label for="chk-${entity.entity_id}" style="cursor:pointer; flex:1;">${name}</label>
                <div class="status-badge">${domain}</div>
            `;
            listDiv.appendChild(div);
        });

        m.classList.add('active');
        
        // Filter logic binding
        document.getElementById('modal-search').addEventListener('input', this.filterModalList);
        document.querySelectorAll('.filter-chip').forEach(chip => {
             // Remove old listeners to avoid stacking
             const cloned = chip.cloneNode(true);
             chip.replaceWith(cloned);
             cloned.addEventListener('click', (e) => {
                  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                  e.target.classList.add('active');
                  this.filterModalList();
             });
        });
    }

    filterModalList() {
        const query = (document.getElementById('modal-search').value || '').toLowerCase();
        const activeChip = document.querySelector('.filter-chip.active');
        const domainFilter = activeChip ? activeChip.dataset.domain : 'all';

        document.querySelectorAll('#entity-selection-list .entity-list-item').forEach(item => {
             const lbl = item.querySelector('label').textContent.toLowerCase();
             const type = item.querySelector('.status-badge').textContent;
             
             const matchesSearch = lbl.includes(query);
             const matchesDomain = domainFilter === 'all' || type === domainFilter;
             
             item.style.display = matchesSearch && matchesDomain ? 'flex' : 'none';
        });
    }

    saveEntitySelection() {
        const inputs = document.querySelectorAll('#entity-selection-list input[type="checkbox"]');
        const selected = [];
        inputs.forEach(inp => {
             if (inp.checked) selected.push(inp.value);
        });
        this.store.saveVisibleEntities(selected);
        
        document.getElementById('settings-modal').classList.remove('active');
        this.fullRender(this.currentStates);
        this.startAutoRefresh();
    }
}
