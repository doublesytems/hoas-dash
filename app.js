// app.js

const DOM = {
    configScreen: document.getElementById('config-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    haUrl: document.getElementById('ha-url'),
    haToken: document.getElementById('ha-token'),
    saveBtn: document.getElementById('save-config-btn'),
    configError: document.getElementById('config-error'),
    reconfigBtn: document.getElementById('reconfigure-btn'),
    connectionStatus: document.getElementById('connection-status'),
    
    visibilityBtn: document.getElementById('visibility-btn'),
    visibilityModal: document.getElementById('visibility-modal'),
    closeVisibilityBtn: document.getElementById('close-visibility-btn'),
    saveVisibilityBtn: document.getElementById('save-visibility-btn'),
    entityListContainer: document.getElementById('entity-list-container'),
    
    lightsContainer: document.getElementById('lights-container'),
    sensorsContainer: document.getElementById('sensors-container'),
    climateContainer: document.getElementById('climate-container')
};

let config = { url: '', token: '' };
let refreshInterval = null;
let currentEntities = {}; // All fetched entities indexed by id
let visibleEntities = []; // Array of visible entity_ids (empty = nothing shown by default)

// Icons (SVG strings)
const ICONS = {
    light: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    switch: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></svg>`,
    temperature: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
    sensor: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    fan: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-2-8 2-8s5 5 2 8c3 3 8 2 8-2-5-5-8-2-8 2z"/><path d="M12 12c3 3 2 8-2 8s-5-5-2-8c-3-3-8-2-8 2 5 5 8 2 8-2z"/></svg>`
};

function init() {
    const savedUrl = localStorage.getItem('ha_url');
    const savedToken = localStorage.getItem('ha_token');
    
    const savedVisible = localStorage.getItem('ha_visible_entities');
    if (savedVisible) {
        try { visibleEntities = JSON.parse(savedVisible); } catch (e) {}
    }

    if (savedUrl && savedToken) {
        config.url = savedUrl;
        config.token = savedToken;
        showDashboard();
    }

    DOM.saveBtn.addEventListener('click', saveConfig);
    DOM.reconfigBtn.addEventListener('click', showConfig);
    
    // Visibility Modal Listeners
    if (DOM.visibilityBtn) {
        DOM.visibilityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openVisibilityModal();
        });
    } else {
        console.error("visibilityBtn not found in DOM");
    }
    
    if (DOM.closeVisibilityBtn) {
        DOM.closeVisibilityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeVisibilityModal();
        });
    }
    
    if (DOM.saveVisibilityBtn) {
        DOM.saveVisibilityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveVisibilityConfig();
        });
    }
}

function saveConfig() {
    const url = DOM.haUrl.value.trim().replace(/\/$/, '');
    const token = DOM.haToken.value.trim();

    if (!url || !token) {
        showError("Please enter both URL and Token");
        return;
    }

    config.url = url;
    config.token = token;
    
    localStorage.setItem('ha_url', url);
    localStorage.setItem('ha_token', token);
    
    showDashboard();
}

function showError(msg) {
    DOM.configError.textContent = msg;
    DOM.configError.classList.remove('hidden');
}

function showConfig() {
    stopAutoRefresh();
    DOM.haUrl.value = config.url;
    DOM.haToken.value = config.token;
    DOM.configScreen.classList.add('active');
    DOM.configScreen.classList.remove('hidden');
    DOM.dashboardScreen.classList.add('hidden');
    DOM.dashboardScreen.classList.remove('active');
}

function showDashboard() {
    DOM.configError.classList.add('hidden');
    DOM.configScreen.classList.remove('active');
    DOM.configScreen.classList.add('hidden');
    DOM.dashboardScreen.classList.remove('hidden');
    DOM.dashboardScreen.classList.add('active');

    fetchStates(true);
    startAutoRefresh();
}

/**
 * Creates API headers
 */
function getHeaders() {
    return {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Show temporary read-only notice
 */
function showReadOnlyNotice() {
    let notice = document.getElementById('ro-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'ro-notice';
        notice.className = 'read-only-notice';
        notice.textContent = "Action failed: Token has Read-Only permissions.";
        document.body.appendChild(notice);
    }
    
    notice.classList.add('show');
    setTimeout(() => {
        notice.classList.remove('show');
    }, 3000);
}

/**
 * Execute a Home Assistant Service call - REMOVED FOR PURE DISPLAY MODE
 */

/**
 * Fetch states from HA Rest API
 */
async function fetchStates(fullRender = false) {
    try {
        DOM.connectionStatus.textContent = "Syncing...";
        const res = await fetch(`${config.url}/api/states`, {
            headers: getHeaders()
        });
        
        if (res.status === 401) {
            stopAutoRefresh();
            showConfig();
            showError("Authentication failed. Check your token.");
            return;
        }
        
        if (!res.ok) throw new Error(`Network issue: HTTP ${res.status}`);
        
        const data = await res.json();
        DOM.connectionStatus.textContent = "Connected";
        
        processEntities(data, fullRender);
    } catch (err) {
        console.error("Fetch error:", err);
        DOM.connectionStatus.textContent = "Connection Error";
    }
}

function processEntities(entities, fullRender) {
    const newStates = {};
    
    // Categorize
    const sensors = [];
    const lightsSwitches = [];
    const fans = [];
    
    entities.forEach(entity => {
        newStates[entity.entity_id] = entity;
        const domain = entity.entity_id.split('.')[0];
        
        // Only include explicitly visible entities (empty visibleEntities = nothing shown)
        if (!visibleEntities.includes(entity.entity_id)) {
            return;
        }
        
        // Filter groups (You can tune filtering logic here)
        if (domain === 'sensor' && entity.attributes.device_class === 'temperature') {
            sensors.push(entity);
        } else if (domain === 'light' || domain === 'switch') {
            lightsSwitches.push(entity);
        } else if (domain === 'fan') {
            fans.push(entity);
        }
    });
    
    if (fullRender) {
        renderSensors(sensors);
        renderLights(lightsSwitches);
        renderFans(fans);
    } else {
        updateEntitiesDom(newStates);
    }
    
    currentEntities = newStates;
}

/** Renders initial DOM for sensors */
function renderSensors(entities) {
    DOM.sensorsContainer.innerHTML = '';
    entities.forEach(entity => {
        const unit = entity.attributes.unit_of_measurement || '';
        const name = entity.attributes.friendly_name || entity.entity_id;
        const iconInfo = ICONS.temperature; // Simplify

        const div = document.createElement('div');
        div.className = 'device-card sensor-card';
        div.id = `card-${entity.entity_id.replace('.', '-')}`;
        
        div.innerHTML = `
            <div class="card-icon">${iconInfo}</div>
            <div class="card-value">
                <span class="value-text" id="val-${entity.entity_id.replace('.', '-')}">${entity.state}</span>
                <span class="card-unit">${unit}</span>
            </div>
            <div class="card-name" title="${name}">${name}</div>
        `;
        DOM.sensorsContainer.appendChild(div);
    });
}

/** Renders initial DOM for lights and switches */
function renderLights(entities) {
    DOM.lightsContainer.innerHTML = '';
    entities.forEach(entity => {
        const domain = entity.entity_id.split('.')[0];
        const name = entity.attributes.friendly_name || entity.entity_id;
        const iconStr = domain === 'light' ? ICONS.light : ICONS.switch;
        const isOn = entity.state === 'on';

        const div = document.createElement('div');
        div.className = `device-card ${isOn ? 'is-on' : ''}`;
        div.id = `card-${entity.entity_id.replace('.', '-')}`;
        
        div.innerHTML = `
            <div class="card-icon">${iconStr}</div>
            <div style="margin-top: auto;">
                <div class="card-name" title="${name}">${name}</div>
                <div class="card-state" id="state-${entity.entity_id.replace('.', '-')}">${entity.state}</div>
            </div>
        `;
        
        DOM.lightsContainer.appendChild(div);
    });
}

/** Renders initial DOM for fans */
function renderFans(entities) {
    DOM.climateContainer.innerHTML = '';
    entities.forEach(entity => {
        const name = entity.attributes.friendly_name || entity.entity_id;
        const isOn = entity.state === 'on';

        const div = document.createElement('div');
        div.className = `device-card ${isOn ? 'is-on' : ''}`;
        div.id = `card-${entity.entity_id.replace('.', '-')}`;
        
        div.innerHTML = `
            <div class="card-icon">${ICONS.fan}</div>
            <div style="margin-top: auto;">
                <div class="card-name" title="${name}">${name}</div>
                <div class="card-state" id="state-${entity.entity_id.replace('.', '-')}">${entity.state}</div>
            </div>
        `;
        
        DOM.climateContainer.appendChild(div);
    });
}

/** Updates DOM elements only if state changed */
function updateEntitiesDom(newStates) {
    for (const [id, entity] of Object.entries(newStates)) {
        const oldEntity = currentEntities[id];
        
        if (!oldEntity || oldEntity.state !== entity.state) {
            const cleanId = id.replace('.', '-');
            const card = document.getElementById(`card-${cleanId}`);
            if (card) {
                // Handle binary state visualizations (on/off)
                if (entity.state === 'on') {
                    card.classList.add('is-on');
                } else if (entity.state === 'off') {
                    card.classList.remove('is-on');
                }
                
                // Update text states
                const stateEl = document.getElementById(`state-${cleanId}`);
                if (stateEl) stateEl.textContent = entity.state;
                
                // Update sensor numerical values
                const valEl = document.getElementById(`val-${cleanId}`);
                if (valEl) valEl.textContent = entity.state;
            }
        }
    }
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => fetchStates(false), 5000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Modal Functions
function openVisibilityModal() {
    DOM.entityListContainer.innerHTML = '';
    
    // Sort entities by domain, then name for presentation
    const sortedEntities = Object.values(currentEntities).sort((a, b) => {
        const domainA = a.entity_id.split('.')[0];
        const domainB = b.entity_id.split('.')[0];
        if (domainA !== domainB) return domainA.localeCompare(domainB);
        return (a.attributes.friendly_name || a.entity_id).localeCompare(b.attributes.friendly_name || b.entity_id);
    });

    sortedEntities.forEach(entity => {
        const domain = entity.entity_id.split('.')[0];
        // Only show relevant entity types in the list to avoid clutter (automations, etc)
        if (!['light', 'switch', 'sensor', 'fan'].includes(domain)) return;
        
        // Filter out non-temperature sensors for cleaner UI as per current logic
        if (domain === 'sensor' && entity.attributes.device_class !== 'temperature') return;

        const isVisible = visibleEntities.includes(entity.entity_id);
        const name = entity.attributes.friendly_name || entity.entity_id;
        
        const div = document.createElement('div');
        div.className = 'entity-list-item';
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${entity.entity_id}" class="visibility-checkbox" ${isVisible ? 'checked' : ''}>
                <span>${name}</span>
                <span class="entity-type-badge">${domain}</span>
            </label>
        `;
        DOM.entityListContainer.appendChild(div);
    });

    DOM.visibilityModal.classList.add('modal-open');
    
    // Clear search field
    const searchInput = document.getElementById('entity-search');
    if (searchInput) searchInput.value = '';
    
    stopAutoRefresh(); // Pause refreshing while editing
}

function closeVisibilityModal() {
    DOM.visibilityModal.classList.remove('modal-open');
    startAutoRefresh();
}

function saveVisibilityConfig() {
    const checkboxes = DOM.entityListContainer.querySelectorAll('.visibility-checkbox');
    const newVisibleEntities = [];
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            newVisibleEntities.push(cb.value);
        }
    });

    visibleEntities = newVisibleEntities;
    localStorage.setItem('ha_visible_entities', JSON.stringify(visibleEntities));
    
    closeVisibilityModal();
    
    // Force a full re-render immediately with new visibility settings
    processEntities(Object.values(currentEntities), true);
}

function filterEntityList() {
    const query = (document.getElementById('entity-search')?.value || '').toLowerCase();
    document.querySelectorAll('.entity-list-item').forEach(item => {
        const label = item.querySelector('label')?.textContent?.toLowerCase() || '';
        item.style.display = label.includes(query) ? '' : 'none';
    });
}

// Boot up
document.addEventListener('DOMContentLoaded', init);

// Temporary click debugger
document.addEventListener('click', (e) => {
    let debugOverlay = document.getElementById('debug-click-overlay');
    if (!debugOverlay) {
        debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-click-overlay';
        debugOverlay.style.position = 'fixed';
        debugOverlay.style.bottom = '10px';
        debugOverlay.style.left = '10px';
        debugOverlay.style.background = 'rgba(255,0,0,0.8)';
        debugOverlay.style.color = 'white';
        debugOverlay.style.padding = '10px';
        debugOverlay.style.zIndex = '9999';
        debugOverlay.style.borderRadius = '5px';
        debugOverlay.style.fontFamily = 'monospace';
        document.body.appendChild(debugOverlay);
    }
    
    // Find closest parent with an ID to understand what we actually hit
    let target = e.target;
    let path = [];
    while (target && target !== document.body) {
        let identifier = target.tagName.toLowerCase();
        if (target.id) identifier += '#' + target.id;
        if (target.className && typeof target.className === 'string') {
             identifier += '.' + target.className.split(' ').join('.');
        }
        path.push(identifier);
        target = target.parentElement;
    }
    
    debugOverlay.innerHTML = 'Clicked:<br>' + path.join('<br>&uarr;<br>');
    console.log("CLICK TRACE:", path);
});
