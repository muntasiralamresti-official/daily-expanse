import { initDB, saveDB } from '../database/db';

const normalize = (note) => ({
  id: note.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: String(note.title || '').trim(),
  content: String(note.content || '').trim(),
  createdAt: Number(note.createdAt) || Date.now(),
  updatedAt: Number(note.updatedAt) || Date.now(),
});

export const getNotes = async () => {
  const db = await initDB();
  return Array.isArray(db.notes) ? db.notes.sort((a, b) => b.updatedAt - a.updatedAt) : [];
};

export const addNote = async ({ title, content }) => {
  const db = await initDB();
  if (!Array.isArray(db.notes)) db.notes = [];
  const note = normalize({ title, content });
  db.notes.unshift(note);
  await saveDB(db);
  return note;
};

export const updateNote = async (id, { title, content }) => {
  const db = await initDB();
  if (!Array.isArray(db.notes)) db.notes = [];
  const note = db.notes.find((item) => item.id === id);
  if (!note) return null;
  note.title = String(title || '').trim();
  note.content = String(content || '').trim();
  note.updatedAt = Date.now();
  await saveDB(db);
  return note;
};

export const deleteNote = async (id) => {
  const db = await initDB();
  db.notes = Array.isArray(db.notes) ? db.notes.filter((note) => note.id !== id) : [];
  await saveDB(db);
};
