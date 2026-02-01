import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Save, Shield, ShieldOff, FileText, Image as ImageIcon,
  Music, Video, Trash2, FilePlus, Menu, Settings, X, Lock, ArrowLeft
} from 'lucide-react';
import {
  encryptData,
  decryptData,
  isEncrypted,
  getStoredPassword,
  setStoredPassword
} from './utils/crypto';

export default function App() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('ronzpad_notes');
    return saved ? JSON.parse(saved) : [{
      id: 1,
      title: 'Welcome to Ronz Pad',
      content: 'This is your secure, modern notepad. Everything you type here is saved locally.',
      timestamp: Date.now(),
      type: 'text',
      files: []
    }];
  });

  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 🔐 Password modal state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // encrypt | decrypt | delete
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Settings
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  useEffect(() => {
    localStorage.setItem('ronzpad_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      timestamp: Date.now(),
      type: 'text',
      files: []
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsSidebarOpen(false);
  };

  const updateNote = (id, updates) => {
    setNotes(notes.map(n =>
      n.id === id ? { ...n, ...updates, timestamp: Date.now() } : n
    ));
  };

  // 🗑️ DELETE → PASSWORD REQUIRED
  const deleteNote = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setPasswordAction('delete');
    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  // 🔐 Password submit handler
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPass = getStoredPassword();

    if (passwordInput !== correctPass) {
      setPasswordError('Incorrect password');
      return;
    }

    if (passwordAction === 'decrypt') {
      const decrypted = decryptData(activeNote.content, passwordInput);
      if (decrypted === null) {
        setPasswordError('Decryption failed');
        return;
      }
      updateNote(activeNote.id, { content: decrypted });
    }

    if (passwordAction === 'encrypt') {
      updateNote(activeNote.id, {
        content: encryptData(activeNote.content, passwordInput)
      });
    }

    if (passwordAction === 'delete' && pendingDeleteId) {
      const remaining = notes.filter(n => n.id !== pendingDeleteId);
      setNotes(remaining);

      if (activeNoteId === pendingDeleteId) {
        setActiveNoteId(remaining[0]?.id || null);
      }
      setPendingDeleteId(null);
    }

    setShowPasswordPrompt(false);
    setPasswordInput('');
    setPasswordError('');
    setPasswordAction(null);
  };

  const requestEncryptionAction = (action) => {
    setPasswordAction(action);
    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const currentPass = getStoredPassword();

    if (oldPass !== currentPass) {
      setSettingsError('Old password incorrect');
      return;
    }
    if (newPass.length < 4) {
      setSettingsError('New password too short');
      return;
    }

    setStoredPassword(newPass);
    setSettingsSuccess('Password updated!');
    setSettingsError('');
    setOldPass('');
    setNewPass('');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeNote) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        data: event.target.result
      };
      updateNote(activeNote.id, {
        files: [...(activeNote.files || []), fileData]
      });
    };
    reader.readAsDataURL(file);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans relative">

      {/* SIDEBAR */}
      <aside className={`fixed inset-0 z-40 bg-white transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-4 border-b flex justify-between">
          <h1 className="font-bold">Ronz Pad</h1>
          <div className="flex gap-2">
            <button onClick={addNote}><Plus /></button>
            <button onClick={() => setIsSidebarOpen(false)}><X /></button>
          </div>
        </div>

        <div className="p-4">
          <input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-slate-100 rounded-xl"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => { setActiveNoteId(note.id); setIsSidebarOpen(false); }}
              className="p-4 bg-slate-50 rounded-xl cursor-pointer"
            >
              <div className="flex justify-between">
                <strong>{note.title}</strong>
                <button onClick={(e) => deleteNote(note.id, e)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {isEncrypted(note.content) ? '🔒 Encrypted Content' : note.content.slice(0, 40)}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }}
          className="p-4 border-t text-left"
        >
          <Settings className="inline mr-2" /> Settings
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <input
            value={activeNote?.title || ''}
            onChange={e => updateNote(activeNote.id, { title: e.target.value })}
            className="font-bold text-lg flex-1"
          />
          <button
            onClick={() =>
              requestEncryptionAction(isEncrypted(activeNote?.content) ? 'decrypt' : 'encrypt')
            }
          >
            {isEncrypted(activeNote?.content) ? <Shield /> : <ShieldOff />}
          </button>
          <label>
            <FilePlus />
            <input type="file" hidden onChange={handleFileUpload} />
          </label>
        </header>

        <textarea
          className="flex-1 p-6 text-lg"
          disabled={isEncrypted(activeNote?.content)}
          value={activeNote?.content || ''}
          onChange={e => updateNote(activeNote.id, { content: e.target.value })}
        />
      </main>

      {/* PASSWORD MODAL */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-2xl w-72">
            <h3 className="font-bold text-center mb-3">
              Enter password to {passwordAction}
            </h3>
            <input
              autoFocus
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
              className="w-full p-3 bg-slate-100 rounded-xl"
            />
            {passwordError && (
              <p className="text-xs text-red-500 mt-2 text-center">{passwordError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowPasswordPrompt(false)} className="flex-1">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl">
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <header className="p-4 border-b flex items-center">
            <button onClick={() => setShowSettings(false)}><ArrowLeft /></button>
            <h2 className="ml-2 font-bold">Settings</h2>
          </header>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <input
              type="password"
              placeholder="Old password"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl"
            />
            {settingsError && <p className="text-red-500 text-sm">{settingsError}</p>}
            {settingsSuccess && <p className="text-green-500 text-sm">{settingsSuccess}</p>}
            <button className="w-full bg-blue-600 text-white p-3 rounded-xl">
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
