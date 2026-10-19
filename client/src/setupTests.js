import "@testing-library/jest-dom";


global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const browserComputedStyle = window.getComputedStyle;
window.getComputedStyle = (element) => browserComputedStyle(element);
global.MessageChannel = class {
  constructor() {
    this.port1 = { onmessage: null };
    this.port2 = {
      postMessage: () =>
        setTimeout(() => {
          if (this.port1.onmessage) this.port1.onmessage();
        }, 0),
    };
  }
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
