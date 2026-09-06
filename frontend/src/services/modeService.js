const MODE_KEY = 'placeflow-mode';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getMode() {
  const mode = getStorage()?.getItem(MODE_KEY);
  return mode === 'online' ? 'online' : 'offline';
}

export function setMode(mode) {
  const next = mode === 'online' ? 'online' : 'offline';
  getStorage()?.setItem(MODE_KEY, next);
  return next;
}

export function isOnlineMode() {
  return getMode() === 'online';
}
