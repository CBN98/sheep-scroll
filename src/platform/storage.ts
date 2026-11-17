import type { StateStorage } from 'zustand/middleware';

// Where progress is saved. Today: this device's localStorage.
// To move to remote storage later, swap this object for one that talks to a
// server — StateStorage methods may return Promises, so async is fine.
// On Capacitor, @capacitor/preferences is a drop-in alternative.
export const storage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // private mode or storage full — progress just won't persist
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
