import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Save, 
  Shield, 
  ShieldOff, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Trash2, 
  FilePlus,
  ChevronRight,
  Menu,
  Settings,
  X,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { encryptData, decryptData, isEncrypted, getStoredPassword, setStoredPassword } from './utils/crypto';

export default function App() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('ronzpad_notes');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Welcome to Ronz Pad', content: 'This is your secure, modern notepad. Everything you type here is saved locally.', timestamp: Date.now(), type: 'text', files: [] }
    ];
  });
  
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Password prompt state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // 'encrypt' or 'decrypt'
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Settings state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

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
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, timestamp: Date.now() } : n));
  };

  const deleteNote = (id, e) => {
    e.stopPropagation();
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNoteId === id) {
      setActiveNoteId(newNotes[0]?.id);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPass = getStoredPassword();
    
    if (passwordInput !== correctPass) {
      setPasswordError('Incorrect password');
      return;
    }

    if (passwordAction === 'decrypt') {
      const decrypted = decryptData(activeNote.content, passwordInput);
      if (decrypted !== null) {
        updateNote(activeNote.id, { content: decrypted });
      } else {
        setPasswordError('Decryption failed');
        return;
      }
    } else if (passwordAction === 'encrypt') {
      const encrypted = encryptData(activeNote.content, passwordInput);
      updateNote(activeNote.id, { content: encrypted });
    }

    setShowPasswordPrompt(false);
    setPasswordInput('');
    setPasswordError('');
  };

  const requestEncryptionAction = (action) => {
    setPasswordAction(action);
    setShowPasswordPrompt(true);
    setPasswordError('');
    setPasswordInput('');
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
        name: file.name,
        type: file.type,
        data: event.target.result,
        id: Date.now()
      };
      updateNote(activeNote.id, { files: [...(activeNote.files || []), fileData] });
    };
    reader.readAsDataURL(file);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans relative">
      {/* Sidebar - Mobile Full Screen Overlay */}
      <aside className={`fixed inset-0 z-40 bg-white transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">Ronz Pad</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={addNote} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <Plus className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-20">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => {
                setActiveNoteId(note.id);
                setIsSidebarOpen(false);
              }}
              className={`group p-4 mb-3 rounded-2xl cursor-pointer transition-all ${activeNoteId === note.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 border-transparent'} border`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-bold text-base truncate pr-4 ${activeNoteId === note.id ? 'text-white' : 'text-slate-800'}`}>
                  {note.title || 'Untitled Note'}
                </h3>
                <button onClick={(e) => deleteNote(note.id, e)} className={`p-1 transition-opacity ${activeNoteId === note.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-sm line-clamp-2 leading-relaxed ${activeNoteId === note.id ? 'text-blue-50' : 'text-slate-500'}`}>
                {isEncrypted(note.content) ? '🔒 Encrypted Content' : note.content || 'No content yet...'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[10px] font-medium ${activeNoteId === note.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(note.timestamp).toLocaleDateString()}
                </span>
                {isEncrypted(note.content) && <Shield className={`w-3 h-3 ${activeNoteId === note.id ? 'text-white' : 'text-blue-500'}`} />}
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Menu in Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-2 text-slate-600 font-semibold text-sm p-2"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v1.2.0</div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col bg-white w-full">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl flex-shrink-0">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <input 
              type="text" 
              className="text-lg font-bold text-slate-800 focus:outline-none border-none bg-transparent truncate w-full"
              value={activeNote?.title || ''}
              placeholder="Note Title"
              onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button 
              onClick={() => requestEncryptionAction(isEncrypted(activeNote?.content) ? 'decrypt' : 'encrypt')}
              className={`p-2 rounded-xl transition-all ${isEncrypted(activeNote?.content) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600'}`}
            >
              {isEncrypted(activeNote?.content) ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
            </button>
            <label className="p-2 bg-slate-100 rounded-xl cursor-pointer">
              <FilePlus className="w-5 h-5 text-slate-600" />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-10">
          <div className="max-w-2xl mx-auto">
            {isEncrypted(activeNote?.content) ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="text-blue-600 w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Encrypted Note</h2>
                <p className="text-slate-500 text-sm mb-6 max-w-[240px] text-center">
                  Verify your password to unlock this content.
                </p>
                <button 
                  onClick={() => requestEncryptionAction('decrypt')}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200"
                >
                  Unlock Now
                </button>
              </div>
            ) : (
              <textarea 
                className="w-full min-h-[50vh] resize-none text-slate-700 leading-relaxed text-lg focus:outline-none placeholder:text-slate-300 bg-transparent"
                placeholder="Start typing your ideas..."
                value={activeNote?.content || ''}
                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
              />
            )}

            {/* Attachments Section */}
            {activeNote?.files?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attachments</h4>
                <div className="grid grid-cols-1 gap-3">
                  {activeNote.files.map(file => (
                    <div key={file.id} className="group flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-blue-500" /> :
                         file.type.startsWith('audio/') ? <Music className="w-5 h-5 text-emerald-500" /> :
                         file.type.startsWith('video/') ? <Video className="w-5 h-5 text-rose-500" /> :
                         <FileText className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{file.type.split('/')[1]}</p>
                      </div>
                      <button 
                        onClick={() => updateNote(activeNote.id, { files: activeNote.files.filter(f => f.id !== file.id) })}
                        className="p-2 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Security Check</h3>
              <p className="text-sm text-slate-500">Please enter your password to {passwordAction} this note.</p>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <input 
                autoFocus
                type="password"
                placeholder="Enter password"
                className={`w-full p-4 bg-slate-100 border-2 ${passwordError ? 'border-red-400' : 'border-transparent'} rounded-2xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-2`}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
              />
              {passwordError && <p className="text-xs text-red-500 font-bold mb-4 text-center">{passwordError}</p>}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="flex-1 py-3 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Panel - Mobile Full Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="h-16 border-b border-slate-100 flex items-center px-4 bg-slate-50">
            <button onClick={() => setShowSettings(false)} className="p-2 mr-2">
              <ArrowLeft className="w-6 h-6 text-slate-800" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          </header>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Security</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
                    <p className="text-[10px] text-slate-400">Keep your pad secure with a fresh pass</p>
                  </div>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Old Password</label>
                    <input 
                      type="password"
                      placeholder="Current pass"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">New Password</label>
                    <input 
                      type="password"
                      placeholder="New pass"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </div>
                  
                  {settingsError && <p className="text-xs text-red-500 font-bold text-center">{settingsError}</p>}
                  {settingsSuccess && <p className="text-xs text-green-500 font-bold text-center">{settingsSuccess}</p>}
                  
                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>

            <div className="text-center py-10">
              <p className="text-slate-400 text-xs">Developed by Ronz</p>
              <p className="text-slate-300 text-[10px] mt-1 italic">Professional Encryption Suite</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
