import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Shield, ShieldOff, FileText, Image as ImageIcon,
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
      content: 'This is your secure, modern notepad.',
      timestamp: Date.now(),
      type: 'text',
      files: []
    }];
  });

  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 🔐 Password modal
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
    const n = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      timestamp: Date.now(),
      files: []
    };
    setNotes([n, ...notes]);
    setActiveNoteId(n.id);
    setIsSidebarOpen(false);
  };

  const updateNote = (id, updates) => {
    setNotes(notes.map(n =>
      n.id === id ? { ...n, ...updates, timestamp: Date.now() } : n
    ));
  };

  // 🗑️ DELETE → REQUIRE PASSWORD
  const deleteNote = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setPasswordAction('delete');
    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  // 🔐 PASSWORD SUBMIT
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correct = getStoredPassword();

    if (passwordInput !== correct) {
      setPasswordError('Incorrect password');
      return;
    }

    if (passwordAction === 'decrypt') {
      const decrypted = decryptData(activeNote.content, passwordInput);
      if (decrypted == null) {
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
    if (oldPass !== getStoredPassword()) {
      setSettingsError('Old password incorrect');
      return;
    }
    if (newPass.length < 4) {
      setSettingsError('Password too short');
      return;
    }
    setStoredPassword(newPass);
    setSettingsSuccess('Password updated');
    setOldPass('');
    setNewPass('');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`fixed inset-0 z-40 bg-white transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex justify-between border-b">
          <h1 className="font-bold">Ronz Pad</h1>
          <button onClick={() => setIsSidebarOpen(false)}><X /></button>
        </div>

        <div className="p-4">
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-slate-100 rounded-xl"
          />
        </div>

        <div className="p-4 space-y-2">
          {filteredNotes.map(n => (
            <div
              key={n.id}
              onClick={() => { setActiveNoteId(n.id); setIsSidebarOpen(false); }}
              className="p-3 bg-slate-50 rounded-xl cursor-pointer"
            >
              <div className="flex justify-between">
                <strong>{n.title}</strong>
                <button onClick={(e) => deleteNote(n.id, e)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {isEncrypted(n.content) ? '🔒 Encrypted' : n.content.slice(0, 30)}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex justify-between">
          <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <input
            value={activeNote?.title || ''}
            onChange={e => updateNote(activeNote.id, { title: e.target.value })}
            className="font-bold text-lg flex-1 ml-3"
          />
          <button
            onClick={() =>
              requestEncryptionAction(isEncrypted(activeNote?.content) ? 'decrypt' : 'encrypt')
            }>
            {isEncrypted(activeNote?.content) ? <Shield /> : <ShieldOff />}
          </button>
        </header>

        <textarea
          className="flex-1 p-6 text-lg"
          value={activeNote?.content || ''}
          disabled={isEncrypted(activeNote?.content)}
          onChange={e => updateNote(activeNote.id, { content: e.target.value })}
        />
      </main>

      {/* PASSWORD MODAL */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-2xl w-72">
            <h3 className="font-bold mb-3 text-center">
              Enter password to {passwordAction}
            </h3>
            <input
              autoFocus
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
              className="w-full p-3 bg-slate-100 rounded-xl"
            />
            {passwordError && <p className="text-red-500 text-xs mt-2">{passwordError}</p>}
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

    </div>
  );
}
