import { readFileSync } from 'fs';
import { resolve } from 'path';

// Setup minimal browser mocks
global.window = {
  location: { href: 'http://localhost:3001/', reload: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  navigator: { userAgent: 'node', clipboard: { writeText: async () => {} } },
  sessionStorage: {
    getItem: (k) => null,
    setItem: (k, v) => {},
    removeItem: (k) => {},
  },
  localStorage: {
    getItem: (k) => null,
    setItem: (k, v) => {},
    removeItem: (k) => {},
  },
};
global.document = {
  getElementById: (id) => ({
    appendChild: () => {},
    innerHTML: '',
  }),
  createElement: (tag) => ({
    style: {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} },
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.sessionStorage = global.window.sessionStorage;
global.localStorage = global.window.localStorage;
global.navigator = global.window.navigator;
global.location = global.window.location;

console.log('Environment mock setup complete.');
