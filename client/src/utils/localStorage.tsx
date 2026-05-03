export function setLocalStorage(name: string, item: string) {
  return localStorage.setItem(name, item);
}

export function getLocalStorage(name: string) {
  const item = localStorage.getItem(name);

  if (!item) {
    return;
  }

  return item;
}

export function removeLocalStorage(name: string) {
  const item = localStorage.getItem(name);

  if (!item) {
    return;
  }

  localStorage.removeItem(name);
}
