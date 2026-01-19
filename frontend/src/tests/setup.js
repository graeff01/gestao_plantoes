import '@testing-library/jest-dom'

// Mock do WebSocket para testes
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // OPEN
  }
  
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Mock do Service Worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      scope: 'http://localhost:3000/'
    }),
    ready: Promise.resolve({
      scope: 'http://localhost:3000/'
    })
  },
  writable: true
})