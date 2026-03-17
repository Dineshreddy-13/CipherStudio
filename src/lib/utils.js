import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export class StepFormatter {
  static divider() {
    return "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  }

  static title(text) {
    return `${text}\n${this.divider()}\n`
  }

  static formatXorSteps({
    inputText,
    outputText,
    key,
    steps,
    isEncrypt = true,
  }) {
    const modeTitle = isEncrypt ? "XOR ENCRYPTION" : "XOR DECRYPTION"

    return `
${this.title(modeTitle)}

INPUT:
${inputText}

KEY:
${key}

OUTPUT:
${outputText}

PROCESS:
${steps.map(s => "• " + s).join("\n")}

${this.divider()}
`.trim()
  }

  /* ---- Generic formatter (future use: RSA/AES) ---- */
  static formatGeneric({
    title,
    input,
    key,
    output,
    steps,
  }) {
    return `
${this.title(title)}

INPUT:
${input}

KEY:
${key ?? "N/A"}

OUTPUT:
${output}

STEPS:
${steps.map(s => "• " + s).join("\n")}

${this.divider()}
`.trim()
  }
}

// utils/stepFormatter.js
export const formatXorSteps = ({
  text,
  hexOut,
  key,
  steps,
  isEncrypt,
}) => {
  const title = isEncrypt
    ? "XOR Encryption Process"
    : "XOR Decryption Process"

  return {
    kind: "xor",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: {
      plaintext: text,
      key,
      output: hexOut,
    },
    steps,
  }
}

export const formatVigenereSteps = ({
  text,
  out,
  key,
  steps,
  isEncrypt,
}) => {
  const title = isEncrypt ? "Vigenère Encryption Process" : "Vigenère Decryption Process"

  return {
    kind: "vigenere",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: {
      plaintext: text,
      key,
      output: out,
    },
    steps,
  }
}


export const formatPlayfairSteps = ({ text, out, key, steps, isEncrypt }) => {
  const title = isEncrypt ? "Playfair Encryption Process" : "Playfair Decryption Process"
  return {
    kind: "playfair",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: { plaintext: text, key, output: out },
    steps,
  }
}

export const formatTranspositionSteps = ({ text, out, key, steps, isEncrypt }) => {
  const title = isEncrypt ? "Transposition Encryption Process" : "Transposition Decryption Process"
  return {
    kind: "transposition",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: { plaintext: text, key, output: out },
    steps,
  }
}

export const formatCaesarSteps = ({ text, out, key, steps, isEncrypt }) => {
  const title = isEncrypt ? "Caesar Cipher Encryption Process" : "Caesar Cipher Decryption Process"
  return {
    kind: "caesar",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: { plaintext: text, key, output: out },
    steps,
  }
}

// utils/stepFormatter.js
export const formatRsaSteps = ({
  steps,
  isEncrypt,
  input,
  output,
}) => {
  return {
    kind: "rsa",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title: isEncrypt ? "RSA Encryption Process" : "RSA Decryption Process",
    summary: {
      input,
      output,
    },
    steps: steps.map(step => ({
      ...step,
      mode: isEncrypt ? "encrypt" : "decrypt",
    })),
  }
}

export const formatAesSteps = ({ text, out, key, steps, isEncrypt }) => {
  const title = isEncrypt ? "AES Encryption Process" : "AES Decryption Process"
  return {
    kind: "aes",
    mode: isEncrypt ? "encrypt" : "decrypt",
    title,
    summary: { plaintext: text, key, output: out },
    steps,
  }
}

export const formatDiffieHellmanSteps = ({
  stage,
  params,
  privateKey,
  publicKey,
  publicKeyA,
  publicKeyB,
  sharedSecret,
  steps,
  isInitiation,
  isResponse,
  isFinalization,
}) => {
  return {
    kind: "diffie-hellman",
    mode: isInitiation ? "initiate" : isResponse ? "respond" : "finalize",
    title: stage || "Diffie-Hellman Key Exchange",
    summary: {
      output: sharedSecret || publicKey || publicKeyB || "",
    },
    steps,
  }
}

export const formatHillCipherSteps = ({ mode, plaintext, ciphertext, keyMatrix, inverseMatrix, mod, steps }) => {
  const title = mode === 'encrypt' ? 'Hill Cipher Encryption Process' : 'Hill Cipher Decryption Process'
  
  return {
    kind: 'hill',
    mode,
    title,
    summary: {
      plaintext: plaintext || ciphertext,
      keyMatrix: keyMatrix || inverseMatrix,
      modulus: mod,
      output: ciphertext || plaintext,
    },
    steps,
  }
}

export const formatRailFenceSteps = ({ mode, plaintext, ciphertext, key, fence, railTexts, steps }) => {
  const title = mode === 'encrypt' ? 'Rail Fence Encryption Process' : 'Rail Fence Decryption Process'
  
  return {
    kind: 'rail-fence',
    mode,
    title,
    summary: {
      plaintext: plaintext || '',
      key,
      output: ciphertext || plaintext,
    },
    fence,
    railTexts,
    steps,
  }
}

export const formatElgamalSteps = ({ mode, steps, plaintext, ciphertext, output }) => {
  const title = mode === 'encrypt' ? 'ElGamal Encryption Process' : 'ElGamal Decryption Process'
  return {
    kind: 'elgamal',
    mode,
    title,
    summary: {
      plaintext: plaintext || '',
      output: output || ciphertext || '',
    },
    steps,
  }
}

/* ========== CRYPTO UTILITIES ========== */

/**
 * Generate a deterministic 2x2 key matrix from a string key
 * Used by Hill cipher and other matrix-based algorithms
 */
export const generateDeterministicKeyMatrix = (keyString, mod) => {
  if (!keyString) throw new Error("Key string is required")
  if (!mod || mod < 2) throw new Error("Valid modulus is required")
  
  let hash = 0
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  const seed = Math.abs(hash)
  let a = Math.abs((seed * 73856093) % mod) || 1
  let b = Math.abs((seed * 19349663) % mod) || 2
  let c = Math.abs((seed * 83492791) % mod) || 3
  let d = Math.abs((seed * 12345) % mod) || 5

  let det = ((a * d) - (b * c)) % mod
  if (det === 0 || det < 0) {
    d = (d + 1) % mod
    if (d === 0) d = 1
  }

  return [[a, b], [c, d]]
}

/* ========== KEY VALIDATION UTILITIES ========== */

/**
 * Validate and parse different types of keys based on algorithm type
 */
export const validateAndParseKey = (keyInput, algorithmId) => {
  if (!keyInput) throw new Error("Key input is required")

  const parseJsonKey = (input) => {
    const trimmed = input.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed)
    }
    return JSON.parse(atob(trimmed))
  }

  try {
    // For JSON-based algorithms (DH, ElGamal)
    if (algorithmId === "diffie-hellman") {
      const keyData = parseJsonKey(keyInput)
      if (!keyData.p || !keyData.e) {
        throw new Error("Invalid DH key format. Expected properties: p, e")
      }
      return keyData
    }

    if (algorithmId === "elgamal") {
      const keyData = parseJsonKey(keyInput)
      if (!keyData.p || !keyData.g || !keyData.h) {
        throw new Error("Invalid ElGamal key format. Expected properties: p, g, h")
      }
      return keyData
    }

    // For other algorithms, return as-is for CryptoKey processing
    return keyInput
  } catch (err) {
    if (err.message.includes("Invalid") || err.message.includes("Expected")) {
      throw err
    }
    throw new Error(`Failed to parse key: ${err.message}`)
  }
}

/**
 * Validate private key structure for asymmetric decryption
 */
export const validatePrivateKey = (privateKey, algorithmId) => {
  if (!privateKey) throw new Error("Private key is required")

  if (algorithmId === "diffie-hellman") {
    if (!privateKey.p || !privateKey.d) {
      throw new Error("Invalid DH private key format. Expected properties: p, d")
    }
    return true
  }

  if (algorithmId === "elgamal") {
    if (!privateKey.p || !privateKey.x) {
      throw new Error("Invalid ElGamal private key format. Expected properties: p, x")
    }
    return true
  }

  return true
}

/* ========== KEY IMPORT UTILITIES ========== */

/**
 * Normalize a PEM or base64 RSA key (removes headers/footers/newlines)
 */
export const normalizeRsaKey = (key) => {
  if (!key) throw new Error("Key is required")

  const trimmed = key.trim()

  // Detect PEM format and strip headers/footers
  const pemMatch = trimmed.match(/-----BEGIN [^-]+-----(.*?)-----END [^-]+-----/s)
  if (pemMatch) {
    return pemMatch[1].replace(/\s+/g, "")
  }

  // Otherwise assume base64 content and strip whitespace/newlines
  return trimmed.replace(/\s+/g, "")
}

/**
 * Import RSA public key for Web Crypto API
 */
export const importRSAPublicKey = async (key) => {
  try {
    const base64Key = normalizeRsaKey(key)

    const binary = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0))
    const arrayBuffer = binary.buffer

    return await crypto.subtle.importKey(
      "spki",
      arrayBuffer,
      { name: "RSA-OAEP", hash: { name: "SHA-256" } },
      true,
      ["encrypt"]
    )
  } catch (err) {
    throw new Error(`Failed to import RSA public key: ${err.message}`)
  }
}

/**
 * Import RSA private key for Web Crypto API
 */
export const importRSAPrivateKey = async (key) => {
  try {
    const base64Key = normalizeRsaKey(key)

    const binary = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0))
    const arrayBuffer = binary.buffer

    return await crypto.subtle.importKey(
      "pkcs8",
      arrayBuffer,
      { name: "RSA-OAEP", hash: { name: "SHA-256" } },
      true,
      ["decrypt"]
    )
  } catch (err) {
    throw new Error(`Failed to import RSA private key: ${err.message}`)
  }
}

/* ========== ENCRYPTION HANDLER UTILITIES ========== */

/**
 * Handle encryption for JSON-based asymmetric algorithms (DH, ElGamal)
 */
export const encryptWithJSONKey = async (plaintext, publicKeyData, algorithm) => {
  if (!plaintext) throw new Error("Plaintext is required")
  if (!publicKeyData) throw new Error("Public key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    const { output, steps, info } = await algorithm.encrypt(plaintext, publicKeyData)
    return { output, steps, info }
  } catch (err) {
    throw new Error(`${algorithm.name} encryption failed: ${err.message}`)
  }
}

/**
 * Handle encryption for CryptoKey-based algorithms (RSA)
 */
export const encryptWithCryptoKey = async (plaintext, cryptoKey, algorithm) => {
  if (!plaintext) throw new Error("Plaintext is required")
  if (!cryptoKey) throw new Error("Crypto key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    const { output, steps, info } = await algorithm.encrypt(plaintext, cryptoKey)
    return { output, steps, info }
  } catch (err) {
    throw new Error(`${algorithm.name} encryption failed: ${err.message}`)
  }
}

/* ========== DECRYPTION HANDLER UTILITIES ========== */

/**
 * Handle decryption for JSON-based asymmetric algorithms (DH, ElGamal)
 */
export const decryptWithJSONKey = async (ciphertext, privateKeyData, algorithm) => {
  if (!ciphertext) throw new Error("Ciphertext is required")
  if (!privateKeyData) throw new Error("Private key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    const result = await algorithm.decrypt(ciphertext, privateKeyData)
    return result
  } catch (err) {
    throw new Error(`${algorithm.name} decryption failed: ${err.message}`)
  }
}

/**
 * Handle decryption for CryptoKey-based algorithms (RSA)
 */
export const decryptWithCryptoKey = async (ciphertext, cryptoKey, algorithm) => {
  if (!ciphertext) throw new Error("Ciphertext is required")
  if (!cryptoKey) throw new Error("Crypto key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    const result = await algorithm.decrypt(ciphertext, cryptoKey)
    return result
  } catch (err) {
    throw new Error(`${algorithm.name} decryption failed: ${err.message}`)
  }
}

/* ========== SYMMETRIC ENCRYPTION UTILITIES ========== */

/**
 * Handle encryption for symmetric algorithms
 */
export const encryptSymmetric = async (plaintext, key, algorithm, options = {}) => {
  if (!plaintext) throw new Error("Plaintext is required")
  if (!key) throw new Error("Key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    let result

    if (algorithm.id === "hill") {
      const keyMatrix = generateDeterministicKeyMatrix(key, 257)
      const keyData = { matrix: keyMatrix, mod: 257 }
      result = algorithm.encrypt(plaintext, keyData, 257)
    } else {
      result = await algorithm.encrypt(plaintext, key)
    }

    return result
  } catch (err) {
    throw new Error(`${algorithm.name} encryption failed: ${err.message}`)
  }
}

/**
 * Handle decryption for symmetric algorithms
 */
export const decryptSymmetric = async (ciphertext, key, algorithm) => {
  if (!ciphertext) throw new Error("Ciphertext is required")
  if (!key) throw new Error("Key is required")
  if (!algorithm) throw new Error("Algorithm is required")

  try {
    let result

    if (algorithm.id === "hill") {
      const keyMatrix = generateDeterministicKeyMatrix(key, 257)
      const keyData = { matrix: keyMatrix, mod: 257 }
      result = await algorithm.decrypt(ciphertext, keyData, 257)
    } else {
      result = await algorithm.decrypt(ciphertext, key)
    }

    return result
  } catch (err) {
    throw new Error(`${algorithm.name} decryption failed: ${err.message}`)
  }
}

/* ========== ERROR HANDLING UTILITIES ========== */

/**
 * Normalize and format error messages for display
 */
export const formatErrorMessage = (error) => {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  return "An unexpected error occurred"
}

/**
 * Create user-friendly error messages based on error type
 */
export const getUserFriendlyErrorMessage = (error, context = "") => {
  const message = formatErrorMessage(error)

  if (message.includes("Public key")) return `Invalid public key: ${message}`
  if (message.includes("Private key")) return `Invalid private key: ${message}`
  if (message.includes("Key")) return `Key error: ${message}`
  if (message.includes("encryption")) return `Encryption failed: ${message}`
  if (message.includes("decryption")) return `Decryption failed: ${message}`
  if (message.includes("format")) return `Format error: ${message}`

  return context ? `${context}: ${message}` : message
}

/* ========== FILE HANDLING UTILITIES ========== */

/**
 * Read a file as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File is required"))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target.result)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Read a file as binary string (for binary files)
 */
export const readFileAsString = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("File is required"))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const binary = String.fromCharCode.apply(null, new Uint8Array(event.target.result))
      resolve(binary)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Download data as a file
 */
export const downloadFile = (content, filename, mimeType = "text/plain") => {
  try {
    if (!content) throw new Error("Content is required")
    if (!filename) throw new Error("Filename is required")

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    throw new Error(`Failed to download file: ${err.message}`)
  }
}

/**
 * Encrypt file content using the provided algorithm
 */
export const encryptFile = async (file, key, algorithm) => {
  try {
    if (!file) throw new Error("File is required")
    if (!key) throw new Error("Key is required")
    if (!algorithm) throw new Error("Algorithm is required")

    const content = await readFileAsText(file)
    let result

    if (algorithm.type === "symmetric") {
      result = await encryptSymmetric(content, key, algorithm)
    } else if (algorithm.type === "asymmetric") {
      if (["diffie-hellman", "elgamal"].includes(algorithm.id)) {
        const publicKeyData = validateAndParseKey(key, algorithm.id)
        result = await encryptWithJSONKey(content, publicKeyData, algorithm)
      } else {
        const importedKey = await importRSAPublicKey(key)
        result = await encryptWithCryptoKey(content, importedKey, algorithm)
      }
    }

    return {
      encryptedContent: result.output,
      filename: `${file.name}.encrypted`,
      originalSize: content.length,
      encryptedSize: result.output.length,
      algorithm: algorithm.name,
      steps: result.steps || [],
    }
  } catch (err) {
    throw new Error(`File encryption failed: ${err.message}`)
  }
}

/**
 * Decrypt file content using the provided algorithm
 */
export const decryptFile = async (file, key, algorithm) => {
  try {
    if (!file) throw new Error("File is required")
    if (!key) throw new Error("Key is required")
    if (!algorithm) throw new Error("Algorithm is required")

    const content = await readFileAsText(file)
    let result

    if (algorithm.type === "symmetric") {
      result = await decryptSymmetric(content, key, algorithm)
    } else if (algorithm.type === "asymmetric") {
      if (["diffie-hellman", "elgamal"].includes(algorithm.id)) {
        const privateKeyData = validateAndParseKey(key, algorithm.id)
        validatePrivateKey(privateKeyData, algorithm.id)
        result = await decryptWithJSONKey(content, privateKeyData, algorithm)
      } else {
        const importedKey = await importRSAPrivateKey(key)
        result = await decryptWithCryptoKey(content, importedKey, algorithm)
      }
    }

    const decryptedContent = result.plaintext || result.output
    const originalFilename = file.name.replace(".encrypted", "")

    return {
      decryptedContent,
      filename: originalFilename,
      algorithm: algorithm.name,
      steps: result.steps || [],
    }
  } catch (err) {
    throw new Error(`File decryption failed: ${err.message}`)
  }
}

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

