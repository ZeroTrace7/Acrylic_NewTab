import { DOM } from './dom.js';
import { Store } from './storage.js';
import { generateId } from './utils.js';
import { toast } from './toast.js';

const TASKS_KEY = 'tasks';
const SUCCESS_AUTOCLEAR_MS = 3800;

let panelEl = null;
let listEl = null;
let emptyEl = null;
let contentEl = null;
let inputRowEl = null;
let inputEl = null;
let clearBtnEl = null;
let progressCountEl = null;
let progressFillEl = null;
let successEl = null;
let isOpen = false;
let tasks = [];
let openPanelRaf = 0;
let openPanelRaf2 = 0;
let successTimeout = null;

const taskRows = new Map();

function normalizeTasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((task) => ({
      id: typeof task?.id === 'string' ? task.id : generateId(),
      text: typeof task?.text === 'string' ? task.text.trim() : '',
      completed: Boolean(task?.completed),
      createdAt: typeof task?.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
    }))
    .filter((task) => task.text.length > 0);
}

function sortTasks() {
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

async function loadTasks() {
  const stored = typeof Store.getTasks === 'function'
    ? await Store.getTasks()
    : await Store.get(TASKS_KEY, []);
  tasks = normalizeTasks(stored);
  sortTasks();
}

async function persistTasks() {
  if (typeof Store.setTasks === 'function') {
    await Store.setTasks(tasks);
    return;
  }
  await Store.set(TASKS_KEY, tasks);
}

function createTaskRow(task) {
  const row = document.createElement('div');
  row.className = 'tasks-item';
  row.dataset.taskId = task.id;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'tasks-check';
  toggleBtn.type = 'button';
  toggleBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  toggleBtn.addEventListener('click', () => toggleTask(row.dataset.taskId));

  const textEl = document.createElement('span');
  textEl.className = 'tasks-text';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'tasks-delete';
  deleteBtn.type = 'button';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="6" y1="18" x2="18" y2="6"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', () => deleteTask(row.dataset.taskId));

  row.append(toggleBtn, textEl, deleteBtn);
  return row;
}

function updateTaskRow(row, task) {
  row.dataset.taskId = task.id;
  row.classList.toggle('is-done', task.completed);

  const toggleBtn = row.querySelector('.tasks-check');
  if (toggleBtn) {
    toggleBtn.classList.toggle('is-done', task.completed);
    toggleBtn.setAttribute('aria-label', task.completed ? 'Mark task as not done' : 'Mark task as done');
  }

  const textEl = row.querySelector('.tasks-text');
  if (textEl) textEl.textContent = task.text;
}

function syncTaskList() {
  if (!listEl) return;

  tasks.forEach((task, index) => {
    let row = taskRows.get(task.id);
    if (!row) {
      row = createTaskRow(task);
      taskRows.set(task.id, row);
    }
    updateTaskRow(row, task);
    const currentAtIndex = listEl.children[index];
    if (currentAtIndex !== row) {
      listEl.insertBefore(row, currentAtIndex || null);
    }
  });

  const activeIds = new Set(tasks.map((task) => task.id));
  [...taskRows.entries()].forEach(([id, row]) => {
    if (activeIds.has(id)) return;
    row.remove();
    taskRows.delete(id);
  });
}

function updatePanelState() {
  if (!progressCountEl || !progressFillEl || !emptyEl || !contentEl || !inputRowEl || !listEl || !clearBtnEl || !successEl) return;

  const total = tasks.length;
  const completed = tasks.reduce((sum, task) => sum + (task.completed ? 1 : 0), 0);
  const allComplete = total > 0 && completed === total;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const hasCompleted = completed > 0;

  progressCountEl.textContent = `${completed}/${total}`;
  progressFillEl.style.width = `${progress}%`;

  clearTimeout(successTimeout);
  clearBtnEl.disabled = !hasCompleted;
  clearBtnEl.style.display = hasCompleted ? 'inline-flex' : 'none';
  emptyEl.style.display = total === 0 ? 'block' : 'none';

  if (!panelEl) return;
  panelEl.classList.toggle('is-success', allComplete);
  if (allComplete) {
    clearBtnEl.style.display = 'none';
    successTimeout = setTimeout(() => {
      clearCompleted({ silent: true });
    }, SUCCESS_AUTOCLEAR_MS);
  }
}

function cleanupSuccessTimer() {
  clearTimeout(successTimeout);
  successTimeout = null;
}

function resetSuccessStateClass() {
  panelEl?.classList.remove('is-success');
}

function showNormalPanelState() {
  resetSuccessStateClass();
  if (emptyEl) emptyEl.style.display = tasks.length === 0 ? 'block' : 'none';
}

async function clearCompleted(options = {}) {
  const { silent = false } = options;
  const remaining = tasks.filter((t) => !t.completed);
  if (remaining.length === tasks.length) return;
  tasks = remaining;
  await persistTasks();
  showNormalPanelState();
  renderTasks();
  if (!silent) {
    toast.info('Completed tasks cleared');
  }
}

function renderTasks() {
  syncTaskList();
  updatePanelState();
}

async function addTask(raw) {
  const text = raw.trim();
  if (!text) {
    toast.error('Task cannot be empty');
    return;
  }

  cleanupSuccessTimer();

  const newTask = {
    id: generateId(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  sortTasks();
  await persistTasks();
  renderTasks();

  if (inputEl) {
    inputEl.value = '';
    inputEl.focus();
  }
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  cleanupSuccessTimer();
  task.completed = !task.completed;
  sortTasks();
  await persistTasks();
  renderTasks();
}

async function deleteTask(id) {
  cleanupSuccessTimer();
  tasks = tasks.filter((t) => t.id !== id);
  await persistTasks();
  showNormalPanelState();
  renderTasks();
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'tasks-panel';
  panel.className = 'glass tasks-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Tasks');
  panel.setAttribute('aria-hidden', 'true');

  const header = document.createElement('div');
  header.className = 'tasks-header';

  const progressHead = document.createElement('div');
  progressHead.className = 'tasks-progress-head';

  const progressLabel = document.createElement('span');
  progressLabel.className = 'tasks-progress-label';
  progressLabel.textContent = 'Progress';

  progressCountEl = document.createElement('span');
  progressCountEl.className = 'tasks-progress-count';
  progressCountEl.textContent = '0/0';

  progressHead.append(progressLabel, progressCountEl);

  const progressTrack = document.createElement('div');
  progressTrack.className = 'tasks-progress-track';

  progressFillEl = document.createElement('div');
  progressFillEl.className = 'tasks-progress-fill';
  progressFillEl.style.width = '0%';
  progressTrack.appendChild(progressFillEl);

  header.append(progressHead, progressTrack);

  contentEl = document.createElement('div');
  contentEl.className = 'tasks-content';

  inputRowEl = document.createElement('div');
  inputRowEl.className = 'tasks-input-row';

  inputEl = document.createElement('input');
  inputEl.className = 'tasks-input';
  inputEl.type = 'text';
  inputEl.placeholder = 'Add a new task...';
  inputEl.autocomplete = 'off';
  inputEl.spellcheck = false;
  inputEl.setAttribute('aria-label', 'Add a new task');
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask(inputEl.value);
    } else if (e.key === 'Escape') {
      closePanel();
    }
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'tasks-add-btn';
  addBtn.type = 'button';
  addBtn.setAttribute('aria-label', 'Add task');
  addBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `;
  addBtn.addEventListener('click', () => addTask(inputEl?.value || ''));

  inputRowEl.append(inputEl, addBtn);

  listEl = document.createElement('div');
  listEl.className = 'tasks-list';

  emptyEl = document.createElement('div');
  emptyEl.className = 'tasks-empty';
  emptyEl.textContent = 'No tasks yet';

  clearBtnEl = document.createElement('button');
  clearBtnEl.className = 'tasks-clear-btn';
  clearBtnEl.type = 'button';
  clearBtnEl.textContent = 'Clear Completed';
  clearBtnEl.addEventListener('click', () => clearCompleted());

  contentEl.append(inputRowEl, listEl, emptyEl, clearBtnEl);

  successEl = document.createElement('div');
  successEl.className = 'tasks-success-card';
  successEl.innerHTML = `
    <div class="tasks-success-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5.8 11.3 2 22l10.7-3.8"></path>
        <path d="M4 3h.01M22 2h.01M18 6h.01M20 10h.01"></path>
        <path d="m14 10-6-6M9 15l-6-6"></path>
        <path d="M8.5 8.5 16 16l4-4-7.5-7.5z"></path>
      </svg>
    </div>
    <p class="tasks-success-text">That's it, good job!</p>
  `;

  panel.append(header, contentEl, successEl);
  return panel;
}

function handleOutsideClick(e) {
  if (!panelEl) return;
  const target = e.target;
  const btn = DOM.tasksBtn;
  if (panelEl.contains(target) || (btn && btn.contains(target))) return;
  closePanel();
}

function handleKeydown(e) {
  if (e.key === 'Escape') closePanel();
}

function openPanel() {
  if (isOpen) return;
  isOpen = true;

  if (!panelEl) {
    panelEl = buildPanel();
    const mount = DOM.tasksPanelMount || document.body;
    mount.appendChild(panelEl);
  }

  if (openPanelRaf) {
    cancelAnimationFrame(openPanelRaf);
    openPanelRaf = 0;
  }
  if (openPanelRaf2) {
    cancelAnimationFrame(openPanelRaf2);
    openPanelRaf2 = 0;
  }

  panelEl.setAttribute('aria-hidden', 'false');
  openPanelRaf = requestAnimationFrame(() => {
    openPanelRaf = 0;
    openPanelRaf2 = requestAnimationFrame(() => {
      openPanelRaf2 = 0;
      if (!isOpen || !panelEl) return;
      panelEl.classList.add('open');
    });
  });

  const btn = DOM.tasksBtn;
  if (btn) {
    btn.classList.add('is-active');
    btn.setAttribute('aria-expanded', 'true');
  }

  renderTasks();
  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleKeydown);
  if (!panelEl.classList.contains('is-success')) {
    setTimeout(() => inputEl?.focus(), 90);
  }
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  cleanupSuccessTimer();
  if (openPanelRaf) {
    cancelAnimationFrame(openPanelRaf);
    openPanelRaf = 0;
  }
  if (openPanelRaf2) {
    cancelAnimationFrame(openPanelRaf2);
    openPanelRaf2 = 0;
  }

  if (panelEl) {
    panelEl.classList.remove('open');
    panelEl.setAttribute('aria-hidden', 'true');
  }

  const btn = DOM.tasksBtn;
  if (btn) {
    btn.classList.remove('is-active');
    btn.setAttribute('aria-expanded', 'false');
  }

  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('keydown', handleKeydown);
}

export async function initTasks() {
  const btn = DOM.tasksBtn;
  if (!btn) return;
  await loadTasks();
  btn.addEventListener('click', () => {
    isOpen ? closePanel() : openPanel();
  });
}
