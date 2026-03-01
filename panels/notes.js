import { Store } from '../modules/storage.js';
import { generateId, truncate, copyToClipboard, downloadTextFile } from '../modules/utils.js';
import { toast } from '../modules/toast.js';

let containerEl = null;
let notes = [];
let view = 'list';
let selectedNote = null;
let editingNote = null;

function btn(label, onclick, extra = '') {
  const b = document.createElement('button');
  b.textContent = label;
  b.setAttribute('style', `padding:4px 10px;border-radius:8px;font-size:0.7rem;cursor:pointer;border:1px solid var(--glass-border-soft);background:var(--glass-subtle);color:var(--text-secondary);transition:all 150ms ease;${extra}`);
  b.onclick = onclick;
  return b;
}

function renderList() {
  containerEl.innerHTML = '';
  // Header
  const hdr = document.createElement('div');
  hdr.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;');
  const h3 = document.createElement('h3');
  h3.textContent = 'My Notes';
  h3.setAttribute('style', 'font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;');
  hdr.appendChild(h3);
  if (notes.length > 0) hdr.appendChild(btn('Download All', downloadAllNotes));
  containerEl.appendChild(hdr);

  // New note trigger
  const trigger = document.createElement('div');
  trigger.setAttribute('style', 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);cursor:text;margin:10px 0;');
  trigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span style="color:var(--text-muted);font-size:0.8rem;">Take a note...</span>`;
  trigger.onclick = () => openEditor(null);
  containerEl.appendChild(trigger);

  if (notes.length === 0) {
    const empty = document.createElement('div');
    empty.setAttribute('style', 'text-align:center;padding:40px 0;color:var(--text-muted);font-size:0.8rem;');
    empty.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;opacity:0.4;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div>No notes yet</div>`;
    containerEl.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.setAttribute('style', 'columns:2;column-gap:10px;');
  notes.forEach(n => grid.appendChild(createNoteCard(n)));
  containerEl.appendChild(grid);
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.setAttribute('style', 'display:inline-block;width:100%;break-inside:avoid;margin-bottom:10px;padding:12px;border-radius:14px;background:var(--glass-subtle);border:1px solid var(--glass-border-soft);cursor:pointer;transition:all 150ms ease;position:relative;');
  card.onmouseenter = () => { card.style.background = 'var(--glass-bg)'; card.style.borderColor = 'var(--glass-border)'; acts.style.opacity = '1'; };
  card.onmouseleave = () => { card.style.background = 'var(--glass-subtle)'; card.style.borderColor = 'var(--glass-border-soft)'; acts.style.opacity = '0'; };
  card.onclick = () => openDetail(note);

  const h4 = document.createElement('h4');
  h4.textContent = truncate(note.title, 28);
  h4.setAttribute('style', 'font-size:0.8rem;font-weight:600;color:var(--text-primary);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
  const p = document.createElement('p');
  p.textContent = note.content;
  p.setAttribute('style', 'font-size:0.75rem;color:var(--text-secondary);line-height:1.5;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;');

  const bottom = document.createElement('div');
  bottom.setAttribute('style', 'display:flex;justify-content:space-between;align-items:center;margin-top:8px;');
  const date = document.createElement('span');
  date.textContent = new Date(note.updatedAt).toLocaleDateString();
  date.setAttribute('style', 'font-size:0.65rem;color:var(--text-ghost);');

  const acts = document.createElement('div');
  acts.setAttribute('style', 'display:flex;gap:4px;opacity:0;transition:opacity 150ms ease;');
  const copyBtn = btn('📋', (e) => { e.stopPropagation(); copyToClipboard(note.content).then(() => toast.info('Copied!')); });
  const delBtn = btn('🗑', (e) => { e.stopPropagation(); deleteNote(note.id); });
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
  title.setAttribute('style', 'font-size:1rem;font-weight:700;color:var(--text-primary);margin:12px 0 4px;');
  const date = document.createElement('div');
  date.textContent = 'Updated ' + new Date(note.updatedAt).toLocaleString();
  date.setAttribute('style', 'font-size:0.65rem;color:var(--text-ghost);margin-bottom:10px;');

  const actions = document.createElement('div');
  actions.setAttribute('style', 'display:flex;gap:6px;margin-bottom:8px;');
  actions.append(
    btn('Copy', () => copyToClipboard(note.content).then(() => toast.info('Copied!'))),
    btn('Edit', () => openEditor(note)),
    btn('Download', () => downloadNote(note)),
    btn('Delete', () => deleteNote(note.id)),
  );

  const content = document.createElement('div');
  content.textContent = note.content;
  content.setAttribute('style', 'font-size:0.85rem;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;overflow-y:auto;margin-top:12px;');

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
  titleIn.setAttribute('style', 'width:100%;background:transparent;border:none;border-bottom:1px solid var(--glass-border-soft);padding:8px 0;font-size:1rem;font-weight:600;color:var(--text-primary);margin-bottom:12px;outline:none;');
  if (note) titleIn.value = note.title;

  const contentIn = document.createElement('textarea');
  contentIn.placeholder = 'Write your note...';
  contentIn.setAttribute('style', 'width:100%;background:transparent;border:none;resize:none;font-size:0.85rem;color:var(--text-secondary);line-height:1.7;min-height:180px;outline:none;font-family:inherit;');
  if (note) contentIn.value = note.content;
  contentIn.addEventListener('input', () => { contentIn.style.height = 'auto'; contentIn.style.height = contentIn.scrollHeight + 'px'; });

  const bar = document.createElement('div');
  bar.setAttribute('style', 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;');
  bar.append(
    btn('Cancel', goBack),
    btn('Save', () => saveNote(titleIn.value, contentIn.value), 'background:var(--glass-bg);color:var(--text-primary);border-color:rgba(96,165,250,0.5);'),
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



