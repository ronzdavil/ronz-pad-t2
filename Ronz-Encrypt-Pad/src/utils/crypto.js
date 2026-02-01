import CryptoJS from 'crypto-js';

// --- App Password ---
export const getAppPassword = () => {
  if (!localStorage.getItem('ronzpad_app_password')) {
    localStorage.setItem('ronzpad_app_password', 'open'); // default
  }
  return localStorage.getItem('ronzpad_app_password');
};

export const setAppPassword = (newPassword) => {
  localStorage.setItem('ronzpad_app_password', newPassword);
};

// --- Note Encryption Password ---
export const getNotePassword = () => {
  if (!localStorage.getItem('ronzpad_note_password')) {
    localStorage.setItem('ronzpad_note_password', 'ronzpad125'); // default
  }
  return localStorage.getItem('ronzpad_note_password');
};

export const setNotePassword = (newPassword) => {
  localStorage.setItem('ronzpad_note_password', newPassword);
};

// --- Encrypt / Decrypt ---
export const encryptData = (data, password) => {
  return CryptoJS.AES.encrypt(data, password).toString();
};

export const decryptData = (encryptedData, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// --- Check if note is encrypted ---
export const isEncrypted = (data) => {
  return typeof data === 'string' && data.startsWith('U2FsdGVkX1');
};
