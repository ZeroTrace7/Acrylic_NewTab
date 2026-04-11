import { Store } from '../modules/storage.js';
import { generateId, truncate, copyToClipboard, downloadTextFile } from '../modules/utils.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let notes = [];
let view = 'list';
let selectedNote = null;
let editingNote = null;

function btn(label, onclick, extraClass = '') {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = `qt-btn ${extraClass}`.trim();
  b.onclick = onclick;
  return b;
}

function renderList() {
  containerEl.innerHTML = '';
  // Header
  const hdr = document.createElement('div');
  hdr.className = 'qt-flex-between qt-mb-sm';
  const h3 = document.createElement('h3');
  h3.textContent = 'My Notes';
  h3.className = 'qt-title';
  hdr.appendChild(h3);
  if (notes.length > 0) hdr.appendChild(btn('Download All', downloadAllNotes));
  containerEl.appendChild(hdr);

  // New note trigger
  const trigger = document.createElement('div');
  trigger.className = 'qt-trigger-btn';
  trigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span class="qt-muted" style="font-size:0.8rem;">Take a note...</span>`;
  trigger.onclick = () => openEditor(null);
  containerEl.appendChild(trigger);

  if (notes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'qt-empty';
    empty.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div>No notes yet</div>`;
    containerEl.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'qt-masonry qt-mt-md';
  notes.forEach(n => grid.appendChild(createNoteCard(n)));
  containerEl.appendChild(grid);
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = 'qt-card interactive';
  card.onclick = () => openDetail(note);

  const h4 = document.createElement('h4');
  h4.textContent = truncate(note.title, 28);
  h4.className = 'qt-card-title';
  const p = document.createElement('p');
  p.textContent = note.content;
  p.className = 'qt-card-body';

  const bottom = document.createElement('div');
  bottom.className = 'qt-flex-between qt-mt-sm';
  const date = document.createElement('span');
  date.textContent = new Date(note.updatedAt).toLocaleDateString();
  date.className = 'qt-date';

  const acts = document.createElement('div');
  acts.className = 'qt-card-actions';
  acts.style.right = '12px';
  acts.style.bottom = '12px';
  acts.style.background = 'var(--glass-bg)';
  acts.style.paddingLeft = '8px';
  
  const copyBtn = btn('📋', (e) => { e.stopPropagation(); copyToClipboard(note.content).then(() => toast.info('Copied!')); }, 'qt-btn-ghost');
  const delBtn = btn('🗑', (e) => { e.stopPropagation(); deleteNote(note.id); }, 'qt-btn-ghost');
  acts.append(copyBtn, delBtn);
  bottom.append(date, acts);

  card.append(h4, p, bottom);
  return card;
}

function openDetail(note) {
  view = 'detail'; selectedNote = note;
  containerEl.innerHTML = '';

  const back = btn('← Back', () => { view = 'list'; renderList(); });
  const title = document.createElement('h3');
  title.textContent = note.title;
  title.className = 'qt-h3';
  const date = document.createElement('div');
  date.textContent = 'Updated ' + new Date(note.updatedAt).toLocaleString();
  date.className = 'qt-date qt-mb-md';

  const actions = document.createElement('div');
  actions.className = 'qt-flex qt-gap-sm qt-mb-md';
  actions.append(
    btn('Copy', () => copyToClipboard(note.content).then(() => toast.info('Copied!'))),
    btn('Edit', () => openEditor(note)),
    btn('Download', () => downloadNote(note)),
    btn('Delete', () => deleteNote(note.id), 'qt-btn-ghost'),
  );

  const content = document.createElement('div');
  content.textContent = note.content;
  content.className = 'qt-note-content';

  containerEl.append(back, title, date, actions, content);
}

function openEditor(note = null) {
  const prevView = view;
  view = 'editor'; editingNote = note;
  containerEl.innerHTML = '';

  const goBack = () => { if (prevView === 'detail' && selectedNote) openDetail(selectedNote); else { view = 'list'; renderList(); } };
  const back = btn('← Back', goBack);

  const titleIn = document.createElement('input');
  titleIn.type = 'text'; titleIn.placeholder = 'Title';
  titleIn.className = 'qt-input-minimal';
  if (note) titleIn.value = note.title;

  const contentIn = document.createElement('textarea');
  contentIn.placeholder = 'Write your note...';
  contentIn.className = 'qt-textarea';
  if (note) contentIn.value = note.content;
  contentIn.addEventListener('input', () => { contentIn.style.height = 'auto'; contentIn.style.height = contentIn.scrollHeight + 'px'; });

  const bar = document.createElement('div');
  bar.className = 'qt-flex qt-gap-sm';
  bar.style.justifyContent = 'flex-end';
  bar.style.marginTop = '12px';
  bar.append(
    btn('Cancel', goBack),
    btn('Save', () => saveNote(titleIn.value, contentIn.value), 'qt-btn-primary'),
  );

  containerEl.append(back, titleIn, contentIn, bar);
  containerEl.addEventListener('keydown', (e) => { if (e.key === 'Escape') goBack(); });
  setTimeout(() => titleIn.focus(), 50);
}

async function saveNote(title, content) {
  if (!content.trim()) { toast.error('Note cannot be empty'); return; }
  try {
    if (editingNote) {
      const updated = { ...editingNote, title: title.trim() || 'Untitled', content: content.trim(), updatedAt: new Date().toISOString() };
      await Store.saveNote(updated);
      const idx = notes.findIndex(n => n.id === updated.id);
      if (idx >= 0) notes[idx] = updated;
      toast.success('Note saved!');
    } else {
      const n = { id: generateId(), title: title.trim() || 'Untitled', content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await Store.saveNote(n);
      notes.unshift(n);
      toast.success('Note created!');
    }
  } catch { toast.error('Failed to save note'); }
  view = 'list'; editingNote = null;
  renderList();
}

async function deleteNote(id) {
  try {
    await Store.deleteNote(id);
    notes = notes.filter(n => n.id !== id);
    toast.info('Note deleted');
  } catch { toast.error('Failed to delete note'); }
  if (view === 'detail') view = 'list';
  renderList();
}

function downloadNote(note) {
  downloadTextFile(note.title + '.txt', 'Title: ' + note.title + '\n\n' + note.content + '\n\nLast Updated: ' + new Date(note.updatedAt).toLocaleString());
}

function downloadAllNotes() {
  const combined = notes.map(n => 'Title: ' + n.title + '\n\n' + n.content + '\n\nLast Updated: ' + new Date(n.updatedAt).toLocaleString()).join('\n\n=====\n\n');
  downloadTextFile('my-notes-' + new Date().toISOString().split('T')[0] + '.txt', combined);
}

export async function initNotes(container) {
  containerEl = container;
  try {
    notes = await Store.getAllNotes();
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch { notes = []; toast.error('Failed to load notes'); }
  renderList();
}



