import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Shield, ShieldOff, Trash2, Menu, X, Settings, Home, Save
} from 'lucide-react';
import {
  encryptData,
  decryptData,
  isEncrypted,
  getAppPassword,
  setAppPassword,
  getNotePassword,
  setNotePassword
} from './utils/crypto';

export default function App() {
  // --- Notes ---
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('ronzpad_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  // --- App Unlock ---
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [appPassInput, setAppPassInput] = useState('');
  const [appPassError, setAppPassError] = useState('');

  // --- Note Password Modal ---
  const [showPass, setShowPass] = useState(false);
  const [passAction, setPassAction] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [passError, setPassError] = useState('');

  // --- Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [currentAppPass, setCurrentAppPass] = useState('');
  const [newAppPass, setNewAppPass] = useState('');
  const [currentNotePass, setCurrentNotePass] = useState('');
  const [newNotePass, setNewNotePass] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // --- Toast Notification ---
  const [toast, setToast] = useState(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- Auto-save notes ---
  useEffect(() => {
    localStorage.setItem('ronzpad_notes', JSON.stringify(notes));
  }, [notes]);

  // --- Browser Notification ---
  const notify = (message) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => {
        if (p === "granted") new Notification(message);
      });
    }
  };

  // --- In-app Toast ---
  const showToast = (message, duration = 2000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  // --- Add Note ---
  const addNote = () => {
    const note = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
      files: [],
      created: Date.now()
    };
    setNotes([note, ...notes]);
    setActiveNoteId(note.id);
    setSidebar(false);
    showToast('New note added!');
  };

  const updateNote = (id, data) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...data } : n));
  };

  // --- Ask Password ---
  const askPassword = (action, noteId = null) => {
    setPassAction(action);
    setPendingDelete(noteId);
    setShowPass(true);
    setPassError('');
  };

  const submitPassword = (e) => {
    e.preventDefault();
    const notePass = getNotePassword();

    // Encrypt note
    if (passAction === 'encrypt') {
      updateNote(activeNote.id, {
        content: encryptData(activeNote.content, notePass)
      });
      showToast('Note encrypted!');
      notify('Note encrypted!');
    }

    // Decrypt note
    if (passAction === 'decrypt') {
      const text = decryptData(activeNote.content, notePass);
      if (!text) {
        setPassError('Decrypt failed');
        return;
      }
      updateNote(activeNote.id, { content: text });
      showToast('Note decrypted!');
      notify('Note decrypted!');
    }

    // Single delete
    if (passAction === 'delete') {
      setNotes(notes.filter(n => n.id !== pendingDelete));
      setActiveNoteId(null);
      showToast('Note deleted!');
      notify('Note deleted!');
    }

    // Multi-delete
    if (passAction === 'multi-delete') {
      setNotes(notes.filter(n => !selectedNotes.includes(n.id)));
      setSelectedNotes([]);
      setActiveNoteId(null);
      showToast('Selected notes deleted!');
      notify('Selected notes deleted!');
    }

    setShowPass(false);
    setPassAction(null);
  };

  // --- App Unlock ---
  const submitAppPassword = (e) => {
    e.preventDefault();
    if (appPassInput !== getAppPassword()) {
      setAppPassError('Wrong password');
      return;
    }
    setAppUnlocked(true);
  };

  // --- Save Note ---
  const saveNote = () => {
    localStorage.setItem('ronzpad_notes', JSON.stringify(notes));
    showToast('Note saved!');
    notify('Note saved!');
  };

  // --- Settings ---
  const submitSettings = (e) => {
    e.preventDefault();

    if (currentAppPass && currentAppPass !== getAppPassword()) {
      setSettingsError('Current App password incorrect');
      return;
    }
    if (newAppPass) setAppPassword(newAppPass);

    if (currentNotePass && currentNotePass !== getNotePassword()) {
      setSettingsError('Current Note password incorrect');
      return;
    }
    if (newNotePass) setNotePassword(newNotePass);

    setShowSettings(false);
    setCurrentAppPass('');
    setNewAppPass('');
    setCurrentNotePass('');
    setNewNotePass('');
    setSettingsError('');
    showToast('Passwords updated!');
    notify('Passwords updated!');
  };

  // --- Filter Notes ---
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleContentChange = (text) => {
    updateNote(activeNote.id, { content: text });
  };

  // ----- APP LOCK SCREEN -----
  if (!appUnlocked) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <form onSubmit={submitAppPassword} className="bg-white p-6 rounded-2xl w-80">
          <h3 className="text-center font-bold mb-3">Enter App Password</h3>
          <input
            autoFocus
            type="password"
            value={appPassInput}
            onChange={e => { setAppPassInput(e.target.value); setAppPassError(''); }}
            className="w-full p-3 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
          />
          {appPassError && <p className="text-red-500 text-xs mt-2">{appPassError}</p>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl">Unlock</button>
          </div>
        </form>
      </div>
    );
  }

  // ----- MAIN APP -----
  return (
    <div className="h-screen flex bg-slate-100 text-slate-900 font-semibold">

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transition-transform
        ${sidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-4 flex justify-between items-center border-b">
          <span className="text-xl font-bold text-blue-600">Ronz Pad</span>
          <button className="md:hidden" onClick={() => setSidebar(false)}>
            <X />
          </button>
        </div>

        <div className="p-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full p-3 rounded-xl bg-slate-100 outline-none border-none focus:ring-0"
          />
        </div>

        <div className="px-3 space-y-2 overflow-y-auto">
          {activeNote && (
            <button
              onClick={() => setActiveNoteId(null)}
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl w-full hover:bg-blue-100"
            >
              <Home className="w-4 h-4" /> Home
            </button>
          )}

          {/* Notes with multi-select */}
          {filtered.map(note => (
            <div key={note.id} className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNotes.includes(note.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) setSelectedNotes([...selectedNotes, note.id]);
                    else setSelectedNotes(selectedNotes.filter(id => id !== note.id));
                  }}
                />
                <div onClick={() => { setActiveNoteId(note.id); setSidebar(false); }}>
                  <div className="truncate">{note.title}</div>
                  <p className="text-xs text-slate-500 mt-1">{isEncrypted(note.content) ? '🔒 Encrypted' : note.content.slice(0, 40)}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); askPassword('delete', note.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}

          {/* Clear Selected */}
          {selectedNotes.length > 0 && (
            <button
              onClick={() => {
                const pass = prompt('Enter Note Password to delete selected notes:');
                if (pass !== getNotePassword()) {
                  alert('Wrong password!');
                  return;
                }
                askPassword('multi-delete');
              }}
              className="flex items-center gap-2 p-3 mt-2 w-full bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" /> Clear Selected
            </button>
          )}
        </div>

        <div className="p-3 border-t">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl w-full hover:bg-blue-100"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center gap-3 p-4 bg-white border-b">
          <button className="md:hidden" onClick={() => setSidebar(true)}>
            <Menu />
          </button>

          {activeNote && (
            <>
              <input
                value={activeNote.title}
                onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                className="flex-1 text-xl bg-transparent outline-none border-none focus:ring-0"
              />

              <button
                onClick={() => askPassword(isEncrypted(activeNote.content) ? 'decrypt' : 'encrypt')}
                className="p-2 rounded-xl bg-blue-100 text-blue-600"
              >
                {isEncrypted(activeNote.content) ? <Shield /> : <ShieldOff />}
              </button>

              <button
                onClick={saveNote}
                className="p-2 rounded-xl bg-blue-100 text-blue-600 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          )}
        </header>

        {activeNoteId === null && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-2">Ronz Encrypt-Pad</h1>
            <p className="text-slate-600 mb-6">Secure notes · {notes.length} total</p>
            <button
              onClick={addNote}
              className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl shadow"
            >
              + New Note
            </button>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map(n => (
                <div
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className="bg-white p-4 rounded-xl shadow cursor-pointer hover:ring-2 hover:ring-blue-400"
                >
                  <h3 className="font-bold truncate">{n.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    {isEncrypted(n.content) ? '🔒 Encrypted' : n.content.slice(0, 90) || 'Empty'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNote && (
          <textarea
            value={activeNote.content}
            onChange={e => handleContentChange(e.target.value)}
            disabled={isEncrypted(activeNote.content)}
            className="flex-1 p-6 text-lg bg-white outline-none border-none resize-none focus:ring-0"
            placeholder="Start typing..."
          />
        )}
      </main>

      {/* PASSWORD MODAL */}
      {showPass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submitPassword} className="bg-white p-6 rounded-2xl w-80">
            <h3 className="text-center font-bold mb-3">Enter Note Password</h3>
            <input
              autoFocus
              type="password"
              onChange={e => { setPassError(''); }}
              className="w-full p-3 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
            />
            {passError && <p className="text-red-500 text-xs mt-2">{passError}</p>}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowPass(false)} className="flex-1">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl">Confirm</button>
            </div>
          </form>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submitSettings} className="bg-white p-6 rounded-2xl w-80">
            <h3 className="text-center font-bold mb-3">Change Passwords</h3>

            <h4 className="font-semibold mt-2">App Password</h4>
            <input
              type="password"
              value={currentAppPass}
              onChange={e => setCurrentAppPass(e.target.value)}
              placeholder="Current App Password"
              className="w-full p-3 mb-2 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
            />
            <input
              type="password"
              value={newAppPass}
              onChange={e => setNewAppPass(e.target.value)}
              placeholder="New App Password"
              className="w-full p-3 mb-2 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
            />

            <h4 className="font-semibold mt-2">Note Encryption Password</h4>
            <input
              type="password"
              value={currentNotePass}
              onChange={e => setCurrentNotePass(e.target.value)}
              placeholder="Current Note Password"
              className="w-full p-3 mb-2 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
            />
            <input
              type="password"
              value={newNotePass}
              onChange={e => setNewNotePass(e.target.value)}
              placeholder="New Note Password"
              className="w-full p-3 mb-2 bg-slate-100 rounded-xl outline-none border-none focus:ring-0"
            />

            {settingsError && <p className="text-red-500 text-xs mt-1">{settingsError}</p>}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowSettings(false)} className="flex-1">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
