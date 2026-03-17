import { formatAesSteps } from "@/lib/utils"

const aesCipher = {
  id: "aes",
  name: "AES (Advanced Encryption Standard)",
  type: "symmetric",

  async encrypt(text, key) {
    try {
      if (!text || !key) throw new Error("Text and key are required")

      // Ensure key is properly formatted (16, 24, or 32 bytes for AES-128, 192, 256)
      const encoder = new TextEncoder()
      let keyBytes = encoder.encode(key)
      
      // Pad or trim key to valid AES length
      const validKeyLength = keyBytes.length <= 16 ? 16 : keyBytes.length <= 24 ? 24 : 32
      keyBytes = new Uint8Array(validKeyLength)
      keyBytes.set(encoder.encode(key).slice(0, validKeyLength))

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      )

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const plaintext = encoder.encode(text)

      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        plaintext
      )

      // Combine IV + ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(ciphertext), iv.length)

      // Convert to Base64
      const output = btoa(String.fromCharCode(...combined))

      // Create step details
      const steps = [
        {
          title: "Step 1 — Key Preparation",
          plaintext: `Key: ${key}`,
          key: `Length: ${keyBytes.length} bytes (${validKeyLength === 16 ? "AES-128" : validKeyLength === 24 ? "AES-192" : "AES-256"})`,
          operation: "Ensure key is valid for AES",
          result: `Key prepared as ${validKeyLength}-byte value`,
          explanation: "AES requires keys of 16, 24, or 32 bytes. The provided key is padded or trimmed as needed.",
        },
        {
          title: "Step 2 — Generate IV",
          plaintext: `Text: ${text}`,
          key: "IV (Initialization Vector)",
          operation: `Generate random 12-byte IV`,
          result: `IV generated: ${Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')}`,
          explanation: "A random 12-byte IV is generated for GCM mode to ensure each encryption is unique.",
        },
        {
          title: "Step 3 — Encrypt with AES-GCM",
          plaintext: `Text: ${text}`,
          key: `Key: ${keyBytes.length} bytes`,
          operation: `AES-GCM cipher with IV`,
          result: `Ciphertext generated (${ciphertext.byteLength} bytes)`,
          explanation: "AES-GCM (Galois/Counter Mode) provides both confidentiality and authentication.",
        },
        {
          title: "Step 4 — Combine IV + Ciphertext",
          plaintext: "Combined data",
          key: "N/A",
          operation: `IV (${iv.length} bytes) + Ciphertext (${ciphertext.byteLength} bytes)`,
          result: `Combined: ${combined.length} bytes`,
          explanation: "The IV is prepended to the ciphertext so it can be extracted during decryption.",
        },
        {
          title: "Step 5 — Base64 Encode",
          plaintext: `Binary data (${combined.length} bytes)`,
          key: "N/A",
          operation: "Convert binary to Base64",
          result: `Output: ${output}`,
          explanation: "Binary data is encoded as Base64 for safe text transmission.",
        },
      ]

      const formatted = formatAesSteps({
        text,
        out: output,
        key,
        steps,
        isEncrypt: true,
      })

      return {
        output,
        steps: { ...formatted, summary: { plaintext: text, key, output, keyLength: `${validKeyLength * 8}-bit` } },
      }
    } catch (error) {
      throw new Error(`AES encryption failed: ${error.message}`)
    }
  },

  async decrypt(text, key) {
    try {
      if (!text || !key) throw new Error("Text and key are required")

      // Ensure key is properly formatted
      const encoder = new TextEncoder()
      let keyBytes = encoder.encode(key)
      const validKeyLength = keyBytes.length <= 16 ? 16 : keyBytes.length <= 24 ? 24 : 32
      keyBytes = new Uint8Array(validKeyLength)
      keyBytes.set(encoder.encode(key).slice(0, validKeyLength))

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      )

      // Decode Base64
      const combined = Uint8Array.from(atob(text), c => c.charCodeAt(0))

      // Extract IV and ciphertext
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)

      // Decrypt
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ciphertext
      )

      const output = new TextDecoder().decode(plaintext)

      // Create step details
      const steps = [
        {
          title: "Step 1 — Key Preparation",
          plaintext: `Key: ${key}`,
          key: `Length: ${keyBytes.length} bytes (${validKeyLength === 16 ? "AES-128" : validKeyLength === 24 ? "AES-192" : "AES-256"})`,
          operation: "Ensure key is valid for AES",
          result: `Key prepared as ${validKeyLength}-byte value`,
          explanation: "Same key used during encryption must be used for decryption.",
        },
        {
          title: "Step 2 — Base64 Decode",
          plaintext: `Ciphertext: ${text}`,
          key: "N/A",
          operation: "Decode Base64 to binary",
          result: `Binary: ${combined.length} bytes`,
          explanation: "The Base64 encoded ciphertext is converted back to binary.",
        },
        {
          title: "Step 3 — Extract IV",
          plaintext: "Combined data",
          key: "N/A",
          operation: `Extract first 12 bytes as IV`,
          result: `IV: ${Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')}`,
          explanation: "The IV is extracted from the beginning of the combined data.",
        },
        {
          title: "Step 4 — Extract Ciphertext",
          plaintext: "Combined data",
          key: "N/A",
          operation: `Extract remaining ${ciphertext.length} bytes as ciphertext`,
          result: `Ciphertext: ${ciphertext.length} bytes`,
          explanation: "The remaining data after the IV is the encrypted message.",
        },
        {
          title: "Step 5 — Decrypt with AES-GCM",
          plaintext: `Ciphertext: ${ciphertext.length} bytes`,
          key: `Key: ${keyBytes.length} bytes`,
          operation: `AES-GCM decryption with extracted IV`,
          result: `Plaintext: ${output}`,
          explanation: "AES-GCM decrypts and verifies the authentication tag simultaneously.",
        },
      ]

      const formatted = formatAesSteps({
        text: output,
        out: text,
        key,
        steps,
        isEncrypt: false,
      })

      return {
        output,
        steps: { ...formatted, summary: { plaintext: output, key, output: text, keyLength: `${validKeyLength * 8}-bit` } },
      }
    } catch (error) {
      throw new Error(`AES decryption failed: ${error.message}`)
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: "O(n)",
    useCases: ["Secure encryption", "Modern standard"],
    security: "Very strong - NIST approved AES-128/192/256",
  },
}

export default aesCipher
