import CryptoJS from 'crypto-js';

export const getStoredPassword = () => {
  return localStorage.getItem('ronzpad_password') || 'ronzpad125';
};

export const setStoredPassword = (newPassword) => {
  localStorage.setItem('ronzpad_password', newPassword);
};

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

export const isEncrypted = (data) => {
  return typeof data === 'string' && data.startsWith('U2FsdGVkX1');
};
