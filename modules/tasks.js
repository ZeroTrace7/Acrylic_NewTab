import { DOM } from './dom.js';
import { Store } from './storage.js';
import { generateId } from './utils.js';
import { toast } from './toast.js';

const TASKS_KEY = 'tasks';

let panelEl = null;
let listEl = null;
let emptyEl = null;
let inputEl = null;
let clearBtnEl = null;
let isOpen = false;
let tasks = [];

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
  const stored = await Store.get(TASKS_KEY, []);
  tasks = normalizeTasks(stored);
  sortTasks();
}

async function persistTasks() {
  await Store.set(TASKS_KEY, tasks);
}

function updateClearButton() {
  if (!clearBtnEl) return;
  const hasCompleted = tasks.some((task) => task.completed);
  clearBtnEl.disabled = !hasCompleted;
}

function renderTasks() {
  if (!listEl || !emptyEl) return;
  listEl.innerHTML = '';

  if (tasks.length === 0) {
    emptyEl.style.display = 'block';
    updateClearButton();
    return;
  }

  emptyEl.style.display = 'none';
  tasks.forEach((task) => listEl.appendChild(createTaskItem(task)));
  updateClearButton();
}

function createTaskItem(task) {
  const item = document.createElement('div');
  item.className = 'tasks-item' + (task.completed ? ' is-done' : '');
  item.dataset.taskId = task.id;

  const checkBtn = document.createElement('button');
  checkBtn.className = 'tasks-check' + (task.completed ? ' is-done' : '');
  checkBtn.ariaLabel = task.completed ? 'Mark task as not done' : 'Mark task as done';
  checkBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  checkBtn.onclick = () => toggleTask(task.id);

  const text = document.createElement('span');
  text.className = 'tasks-text';
  text.textContent = task.text;

  const delBtn = document.createElement('button');
  delBtn.className = 'tasks-delete';
  delBtn.ariaLabel = 'Delete task';
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="6" y1="18" x2="18" y2="6"></line></svg>`;
  delBtn.onclick = () => deleteTask(task.id);

  item.append(checkBtn, text, delBtn);
  return item;
}

async function addTask(raw) {
  const text = raw.trim();
  if (!text) {
    toast.error('Task cannot be empty');
    return;
  }

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
  task.completed = !task.completed;
  sortTasks();
  await persistTasks();
  renderTasks();
}

async function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  await persistTasks();
  renderTasks();
}

async function clearCompleted() {
  const remaining = tasks.filter((t) => !t.completed);
  if (remaining.length === tasks.length) return;
  tasks = remaining;
  await persistTasks();
  renderTasks();
  toast.info('Completed tasks cleared');
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

  const title = document.createElement('h3');
  title.className = 'tasks-title';
  title.textContent = 'Tasks';

  clearBtnEl = document.createElement('button');
  clearBtnEl.className = 'tasks-clear-btn';
  clearBtnEl.textContent = 'Clear done';
  clearBtnEl.onclick = () => clearCompleted();

  header.append(title, clearBtnEl);

  const inputRow = document.createElement('div');
  inputRow.className = 'tasks-input-row';

  inputEl = document.createElement('input');
  inputEl.className = 'tasks-input';
  inputEl.type = 'text';
  inputEl.placeholder = 'Add a task...';
  inputEl.autocomplete = 'off';
  inputEl.spellcheck = false;
  inputEl.setAttribute('aria-label', 'Add a task');
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
  addBtn.ariaLabel = 'Add task';
  addBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
  addBtn.onclick = () => addTask(inputEl?.value || '');

  inputRow.append(inputEl, addBtn);

  listEl = document.createElement('div');
  listEl.className = 'tasks-list';

  emptyEl = document.createElement('div');
  emptyEl.className = 'tasks-empty';
  emptyEl.textContent = 'No tasks yet';

  panel.append(header, inputRow, listEl, emptyEl);
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

  panelEl.classList.add('open');
  panelEl.setAttribute('aria-hidden', 'false');

  const btn = DOM.tasksBtn;
  if (btn) {
    btn.classList.add('is-active');
    btn.setAttribute('aria-expanded', 'true');
  }

  renderTasks();
  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleKeydown);
  setTimeout(() => inputEl?.focus(), 60);
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;

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
