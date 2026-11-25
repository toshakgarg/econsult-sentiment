import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const storageValues = new Map()
const localStorageMock = {
  get length() {
    return storageValues.size
  },
  clear: () => storageValues.clear(),
  getItem: (key) => storageValues.get(String(key)) ?? null,
  key: (index) => Array.from(storageValues.keys())[index] ?? null,
  removeItem: (key) => storageValues.delete(String(key)),
  setItem: (key, value) => storageValues.set(String(key), String(value)),
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
})

afterEach(() => {
  cleanup()
})
