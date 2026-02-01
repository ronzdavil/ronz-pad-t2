import CryptoJS from 'crypto-js';

// --- APP PASSWORD ---
const APP_PASSWORD_KEY = 'ronzpad_app_pass';
export const getAppPassword = () => {
  return localStorage.getItem(APP_PASSWORD_KEY) || 'open';
};
export const setAppPassword = (newPassword) => {
  localStorage.setItem(APP_PASSWORD_KEY, newPassword);
};

// --- NOTE ENCRYPTION PASSWORD ---
const NOTE_PASSWORD_KEY = 'ronzpad_note_pass';
export const getNotePassword = () => {
  return localStorage.getItem(NOTE_PASSWORD_KEY) || 'ronzpad125';
};
export const setNotePassword = (newPassword) => {
  localStorage.setItem(NOTE_PASSWORD_KEY, newPassword);
};

// --- ENCRYPT / DECRYPT ---
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

// --- CHECK IF DATA IS ENCRYPTED ---
export const isEncrypted = (data) => {
  return typeof data === 'string' && data.startsWith('U2FsdGVkX1');
};
