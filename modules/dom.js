export const DOM = {
  clock: document.getElementById('simple-clock'),
  date: document.getElementById('date-text'),
  greeting: document.getElementById('greeting-text'),

  searchInput: document.getElementById('search-input'),
  searchSubmit: document.getElementById('search-submit'),
  engineBtn: document.getElementById('engine-btn'),
  enginePicker: document.getElementById('engine-picker'),

  addLinkBtn: document.getElementById('add-link-btn'),

  get sidebarGrid() {
    return document.getElementById('sidebar-apps-grid');
  },

  get bottomGrid() {
    return document.getElementById('bottom-links-grid');
  },

  settingsBtn: document.getElementById('settings-btn'),
  toolsFab: document.getElementById('tools-fab'),
  leftDock: document.getElementById('left-dock'),

  get rightPanel() {
    return document.getElementById('right-panel');
  },

  get toolsPanelMount() {
    return document.getElementById('tools-panel-mount');
  }
};

