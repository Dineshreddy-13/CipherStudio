import {create} from 'zustand'

// Initialize theme from localStorage (safe access)
let initialTheme = 'light'
try {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') initialTheme = saved
} catch (e) {
  // ignore (e.g., SSR or privacy settings)
}

// Ensure document class matches initial theme
try {
  if (typeof document !== 'undefined') {
    if (initialTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }
} catch (e) {}

const useAppStore = create((set) => ({
  algorithm: null,
  setAlgorithm: (algo) => set({ algorithm: algo }),

  // Sender inputs
  senderText: "",
  setSenderText: (text) => set({ senderText: text }),

  senderSymKey: "",
  setSenderSymKey: (key) => set({ senderSymKey: key }),

  senderPublicKeyInput: "",
  setSenderPublicKeyInput: (key) => set({ senderPublicKeyInput: key }),

  // Receiver inputs
  receiverKeyInput: "",
  setReceiverKeyInput: (key) => set({ receiverKeyInput: key }),

  receiverEncryptedText: "",
  setReceiverEncryptedText: (text) => set({ receiverEncryptedText: text }),

  // Sender data (results)
  senderData: {
    sessionKey: "",
    encryptedMessage: "",
    steps: [],
  },
  setSenderData: (updater) =>
    set((state) => ({
      senderData: typeof updater === 'function' ? updater(state.senderData) : { ...state.senderData, ...updater },
    })),

  // Receiver data (results)
  receiverData: {
    publicKey: "",
    privateKey: "",
    steps: [],
  },
  setReceiverData: (updater) =>
    set((state) => ({
      receiverData: typeof updater === 'function' ? updater(state.receiverData) : { ...state.receiverData, ...updater },
    })),

  // Algorithm mode
  algorithmMode: "encrypt",
  setAlgorithmMode: (mode) => set({ algorithmMode: mode }),

  // Theme
  theme: initialTheme,
  setTheme: (newTheme) => {
    set({ theme: newTheme })
    try {
      localStorage.setItem('theme', newTheme)
    } catch (e) {}
    // Apply the theme to the document
    try {
      const htmlElement = document.documentElement
      if (newTheme === "dark") htmlElement.classList.add("dark")
      else htmlElement.classList.remove("dark")
    } catch (e) {}
  },

  // Clear all data
  clearAllData: () => set({
    algorithm: null,
    senderText: "",
    senderSymKey: "",
    senderPublicKeyInput: "",
    receiverKeyInput: "",
    receiverEncryptedText: "",
    senderData: { sessionKey: "", encryptedMessage: "", steps: [] },
    receiverData: { publicKey: "", privateKey: "", steps: [] },
    algorithmMode: "encrypt",
  }),
}))

export default useAppStore
