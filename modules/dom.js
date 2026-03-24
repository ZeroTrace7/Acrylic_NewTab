export const DOM = {
  get appBody() {
    return document.getElementById('app-body');
  },

  get clock() {
    return document.getElementById('simple-clock');
  },

  get date() {
    return document.getElementById('date-text');
  },

  get greeting() {
    return document.getElementById('greeting-text');
  },

  get clockZone() {
    return document.getElementById('clock-zone');
  },

  get searchInput() {
    return document.getElementById('search-input');
  },

  get searchSection() {
    return document.getElementById('search-section');
  },

  get searchSubmit() {
    return document.getElementById('search-submit');
  },

  get searchWrapper() {
    return document.getElementById('search-wrapper');
  },

  get engineBtn() {
    return document.getElementById('engine-btn');
  },

  get engineIcon() {
    return document.getElementById('engine-icon');
  },

  get enginePicker() {
    return document.getElementById('engine-picker');
  },

  get searchHistoryPanel() {
    return document.getElementById('search-history-panel');
  },

  get addLinkBtn() {
    return document.getElementById('add-link-btn');
  },

  get sidebarGrid() {
    return document.getElementById('sidebar-apps-grid');
  },

  get bottomGrid() {
    return document.getElementById('bottom-links-grid');
  },

  get quicklinksZone() {
    return document.getElementById('quicklinks-zone');
  },

  get settingsBtn() {
    return document.getElementById('settings-btn');
  },

  get tasksBtn() {
    return document.getElementById('tasks-btn');
  },

  get toolsFab() {
    return document.getElementById('tools-fab');
  },

  get manageQuicklinksBtn() {
    return document.getElementById('manage-quicklinks-btn')
      || document.getElementById('ql-more-btn')
      || document.getElementById('tools-fab');
  },

  get productivityToolBtn() {
    return document.getElementById('productivity-tool-btn')
      || document.getElementById('focus-btn');
  },

  get zenModeBtn() {
    return document.getElementById('focus-btn');
  },

  get quickToolsBtn() {
    return document.getElementById('quick-tools-btn')
      || document.getElementById('grid-view-btn');
  },

  get leftDock() {
    return document.getElementById('left-dock');
  },

  get rightPanel() {
    return document.getElementById('right-panel');
  },

  get toolsPanelMount() {
    return document.getElementById('tools-panel-mount');
  },

  get toastContainer() {
    return document.getElementById('toast-container');
  },

  get onboardingMount() {
    return document.getElementById('onboarding-mount');
  },

  get settingsModalMount() {
    return document.getElementById('settings-modal-mount');
  },

  get tasksPanelMount() {
    return document.getElementById('tasks-panel-mount');
  }
};

