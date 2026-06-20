const store = {};

export const localStorageStub = {
  getItem:    (k)    => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k)    => { delete store[k]; },
  clear:      ()     => { Object.keys(store).forEach(k => delete store[k]); },
};
