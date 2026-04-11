import { Store } from '../modules/storage.js';
import { generateId, truncate, copyToClipboard, downloadTextFile } from '../modules/utils.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let notes = [];
let view = 'list';
let selectedNote = null;
let editingNote = null;

const STARTER_NOTE_SEEDED_KEY = 'notesStarterSeeded';
const NOTE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const NOTE_ICONS = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg>`,
  download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`,
};

const STARTER_NOTE_TITLE = '👋 Welcome to Acrylic Notes!';
const STARTER_NOTE_CONTENT = `This is your personal space for quick thoughts and ideas.

⭐ Pro Tips:

• Web Clipper: Right-click any text on the web and select "Save to Acrylic Notes" to save it here instantly.
• Actions: You can Edit, Copy, or Download any note using the menu options.
• Privacy: Your notes are stored 100% locally on your device.

Feel free to edit or delete this note to get started!`;

function mountAnimatedStage(builder) {
  containerEl.innerHTML = '';

  const stage = document.createElement('div');
  stage.className = 'qt-note-stage';
  containerEl.appendChild(stage);

  builder(stage);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      stage.classList.add('is-visible');
    });
  });
}

function textBtn(label, onclick, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = `qt-btn ${extraClass}`.trim();
  button.onclick = onclick;
  return button;
}

function iconBtn({ title, icon, onclick, extraClass = '' }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `qt-note-action ${extraClass}`.trim();
  button.ariaLabel = title;
  button.title = title;
  button.innerHTML = icon;
  button.onclick = onclick;
  return button;
}

function formatNoteDate(value) {
  return NOTE_DATE_FORMATTER.format(new Date(value));
}

async function copyNoteText(text) {
  const copied = await copyToClipboard(text);
  if (copied) {
    toast.info('Copied!');
    return;
  }
  toast.error('Could not copy note');
}

async function ensureStarterNote() {
  const seeded = await Store.get(STARTER_NOTE_SEEDED_KEY, false);

  if (notes.length > 0) {
    if (!seeded) await Store.set(STARTER_NOTE_SEEDED_KEY, true);
    return;
  }

  if (seeded) return;

  const now = new Date().toISOString();
  const starterNote = {
    id: generateId(),
    title: STARTER_NOTE_TITLE,
    content: STARTER_NOTE_CONTENT,
    createdAt: now,
    updatedAt: now,
  };

  await Store.saveNote(starterNote);
  await Store.set(STARTER_NOTE_SEEDED_KEY, true);
  notes = [starterNote];
}

function renderList() {
  mountAnimatedStage((stage) => {
    const header = document.createElement('div');
    header.className = 'qt-flex-between qt-mb-sm';

    const title = document.createElement('h3');
    title.textContent = 'My Notes';
    title.className = 'qt-title';
    header.appendChild(title);

    if (notes.length > 0) {
      header.appendChild(textBtn('Download All', downloadAllNotes));
    }
    stage.appendChild(header);

    const trigger = document.createElement('div');
    trigger.className = 'qt-trigger-btn';
    trigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span class="qt-muted" style="font-size:0.8rem;">Take a note...</span>`;
    trigger.onclick = () => openEditor(null);
    stage.appendChild(trigger);

    if (notes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'qt-empty';
      empty.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><div>No notes yet</div>`;
      stage.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'qt-masonry qt-mt-md';
    notes.forEach((note) => grid.appendChild(createNoteCard(note)));
    stage.appendChild(grid);
  });
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = 'qt-card interactive qt-note-card';
  card.onclick = () => openDetail(note);

  const noteTitle = document.createElement('h4');
  noteTitle.textContent = truncate(note.title, 28);
  noteTitle.className = 'qt-card-title';

  const preview = document.createElement('p');
  preview.textContent = note.content;
  preview.className = 'qt-card-body qt-note-card-body';

  const bottom = document.createElement('div');
  bottom.className = 'qt-flex-between qt-mt-sm';

  const date = document.createElement('span');
  date.textContent = formatNoteDate(note.updatedAt);
  date.className = 'qt-date qt-note-card-date';

  const actions = document.createElement('div');
  actions.className = 'qt-card-actions qt-note-card-actions';
  actions.append(
    iconBtn({
      title: 'Copy note',
      icon: NOTE_ICONS.copy,
      onclick: async (event) => {
        event.stopPropagation();
        await copyNoteText(note.content);
      },
    }),
    iconBtn({
      title: 'Delete note',
      icon: NOTE_ICONS.delete,
      extraClass: 'is-danger',
      onclick: async (event) => {
        event.stopPropagation();
        await deleteNote(note.id);
      },
    }),
  );

  bottom.append(date, actions);
  card.append(noteTitle, preview, bottom);
  return card;
}

function openDetail(note) {
  view = 'detail';
  selectedNote = note;
  mountAnimatedStage((stage) => {
    const head = document.createElement('div');
    head.className = 'qt-note-detail-head';

    const back = iconBtn({
      title: 'Back to notes',
      icon: NOTE_ICONS.back,
      extraClass: 'is-ghost',
      onclick: () => {
        view = 'list';
        renderList();
      },
    });

    const meta = document.createElement('div');
    meta.className = 'qt-note-detail-meta';

    const title = document.createElement('h3');
    title.textContent = note.title;
    title.className = 'qt-h3 qt-note-detail-title';

    const date = document.createElement('div');
    date.textContent = formatNoteDate(note.updatedAt);
    date.className = 'qt-date qt-note-detail-date';

    meta.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'qt-note-detail-actions';
    actions.append(
      iconBtn({
        title: 'Copy note',
        icon: NOTE_ICONS.copy,
        onclick: () => copyNoteText(note.content),
      }),
      iconBtn({
        title: 'Edit note',
        icon: NOTE_ICONS.edit,
        onclick: () => openEditor(note),
      }),
      iconBtn({
        title: 'Download note',
        icon: NOTE_ICONS.download,
        onclick: () => downloadNote(note),
      }),
      iconBtn({
        title: 'Delete note',
        icon: NOTE_ICONS.delete,
        extraClass: 'is-danger',
        onclick: () => deleteNote(note.id),
      }),
    );

    head.append(back, meta, actions);

    const divider = document.createElement('div');
    divider.className = 'qt-divider qt-note-detail-divider';

    const content = document.createElement('div');
    content.textContent = note.content;
    content.className = 'qt-note-content';

    stage.append(head, divider, content);
  });
}

function openEditor(note = null) {
  const previousView = view;
  view = 'editor';
  editingNote = note;

  const goBack = () => {
    if (previousView === 'detail' && selectedNote) {
      openDetail(selectedNote);
      return;
    }
    view = 'list';
    renderList();
  };

  mountAnimatedStage((stage) => {
    const back = textBtn('← Back', goBack);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Title';
    titleInput.className = 'qt-input-minimal';
    if (note) titleInput.value = note.title;

    const contentInput = document.createElement('textarea');
    contentInput.placeholder = 'Write your note...';
    contentInput.className = 'qt-textarea';
    if (note) contentInput.value = note.content;
    contentInput.addEventListener('input', () => {
      contentInput.style.height = 'auto';
      contentInput.style.height = `${contentInput.scrollHeight}px`;
    });
    const handleEscape = (event) => {
      if (event.key === 'Escape') goBack();
    };
    titleInput.addEventListener('keydown', handleEscape);
    contentInput.addEventListener('keydown', handleEscape);

    const actions = document.createElement('div');
    actions.className = 'qt-flex qt-gap-sm';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '12px';
    actions.append(
      textBtn('Cancel', goBack),
      textBtn('Save', () => saveNote(titleInput.value, contentInput.value), 'qt-btn-primary'),
    );

    stage.append(back, titleInput, contentInput, actions);
    setTimeout(() => titleInput.focus(), 50);
  });
}

async function saveNote(title, content) {
  if (!content.trim()) {
    toast.error('Note cannot be empty');
    return;
  }

  try {
    if (editingNote) {
      const updated = {
        ...editingNote,
        title: title.trim() || 'Untitled',
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      };
      await Store.saveNote(updated);
      const index = notes.findIndex((note) => note.id === updated.id);
      if (index >= 0) notes[index] = updated;
      selectedNote = updated;
      toast.success('Note saved!');
    } else {
      const created = {
        id: generateId(),
        title: title.trim() || 'Untitled',
        content: content.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await Store.saveNote(created);
      notes.unshift(created);
      selectedNote = created;
      toast.success('Note created!');
    }
  } catch {
    toast.error('Failed to save note');
  }

  view = 'list';
  editingNote = null;
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  renderList();
}

async function deleteNote(id) {
  try {
    await Store.deleteNote(id);
    notes = notes.filter((note) => note.id !== id);
    if (selectedNote?.id === id) selectedNote = null;
    toast.info('Note deleted');
  } catch {
    toast.error('Failed to delete note');
  }

  view = 'list';
  renderList();
}

function downloadNote(note) {
  downloadTextFile(
    `${note.title}.txt`,
    `Title: ${note.title}\n\n${note.content}\n\nLast Updated: ${formatNoteDate(note.updatedAt)}`,
  );
}

function downloadAllNotes() {
  const combined = notes
    .map((note) => `Title: ${note.title}\n\n${note.content}\n\nLast Updated: ${formatNoteDate(note.updatedAt)}`)
    .join('\n\n=====\n\n');

  downloadTextFile(`my-notes-${new Date().toISOString().split('T')[0]}.txt`, combined);
}

export async function initNotes(container) {
  containerEl = container;
  view = 'list';
  selectedNote = null;
  editingNote = null;

  try {
    notes = await Store.getAllNotes();
    await ensureStarterNote();
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch {
    notes = [];
    toast.error('Failed to load notes');
  }

  renderList();
}
