/* js/app.js */
import { Store } from './store.js';
import { HomeAssistantAPI } from './api.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();
    const api = new HomeAssistantAPI(store.config.url, store.config.token);
    const ui = new UIManager(store, api);

    ui.start();
});
