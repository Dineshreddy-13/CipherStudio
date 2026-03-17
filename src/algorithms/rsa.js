// algorithms/rsaCipher.js
// import { formatRsaSteps } from "@/utils/stepFormatter"
import { formatRsaSteps } from "@/lib/utils"

const rsaCipher = {
  id: "rsa",
  name: "RSA",
  type: "asymmetric",

  async generateKeys() {
    return crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    )
  },

  async encrypt(text, publicKey) {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(text)

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded
    )

    const encryptedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(encryptedBuffer))
    )

    const steps = [
      {
        title: "Step 1 — Prepare plaintext",
        plaintext: text,
        key: "N/A",
        operation: "utf8_encode(plaintext) → bytes",
        result: `${encoded.length} bytes`,
        explanation:
          "The plaintext message is converted into bytes using UTF-8 encoding.",
      },
      {
        title: "Step 2 — Apply RSA-OAEP padding",
        plaintext: "padded form",
        key: "N/A",
        operation: "OAEP(plaintext_bytes) → padded_bytes",
        result: "padded bytes ready",
        explanation:
          "OAEP padding adds randomness to prevent deterministic encryption and chosen-plaintext attacks. It transforms the plaintext bytes into a padded structure ready for modular exponentiation.",
      },
      {
        title: "Step 3 — Encrypt using Public Key",
        plaintext: "padded bytes",
        key: "Public key (e, n)",
        operation: "ciphertext = padded^e mod n",
        result: `${encryptedBase64.length} chars`,
        explanation:
          "RSA encrypts the padded bytes using the receiver’s public key (exponent e and modulus n). Only the matching private key can reverse this operation.",
      },
      {
        title: "Step 4 — Encode output",
        plaintext: "encrypted bytes",
        key: "N/A",
        operation: "base64_encode(ciphertext_bytes) → base64",
        result: encryptedBase64.slice(0, 60) + "...",
        explanation:
          "The encrypted binary data is Base64-encoded for safe display and transport.",
      },
    ]

    return {
      output: encryptedBase64,
      steps: formatRsaSteps({
        steps,
        isEncrypt: true,
        input: text,
        output: encryptedBase64,
      }),
    }
  },

  async decrypt(cipherText, privateKey) {
    const binary = Uint8Array.from(
      atob(cipherText),
      c => c.charCodeAt(0)
    )

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      binary
    )

    const decryptedText = new TextDecoder().decode(decryptedBuffer)

    const steps = [
      {
        title: "Step 1 — Decode ciphertext",
        plaintext: cipherText.slice(0, 40) + "...",
        key: "N/A",
        operation: "base64_decode(ciphertext) → ciphertext_bytes",
        result: `${binary.length} bytes`,
        explanation:
          "The Base64-encoded ciphertext is converted back into binary form.",
      },
      {
        title: "Step 2 — Decrypt using Private Key",
        plaintext: "ciphertext bytes",
        key: "Private key (d, n)",
        operation: "padded = ciphertext^d mod n",
        result: "padded plaintext bytes",
        explanation:
          "RSA decryption applies the private exponent d on the ciphertext to recover the padded plaintext bytes.",
      },
      {
        title: "Step 3 — Remove OAEP padding",
        plaintext: "padded plaintext bytes",
        key: "N/A",
        operation: "OAEP_unpad(padded) → plaintext_bytes",
        result: "plaintext bytes",
        explanation:
          "OAEP padding is verified and removed to recover the original message bytes.",
      },
      {
        title: "Step 4 — Decode plaintext",
        result: decryptedText,
        operation: "utf8_decode(plaintext_bytes) → plaintext",
        explanation:
          "The decrypted bytes are decoded back into readable UTF-8 text.",
      },
    ]

    return {
      output: decryptedText,
      steps: formatRsaSteps({
        steps,
        isEncrypt: false,
        input: cipherText,
        output: decryptedText,
      }),
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: "Depends on key size (modular exponentiation)",
    useCases: [
      "Secure key exchange",
      "Encrypt small secrets/session keys",
      "Digital signatures (related use)",
    ],
    security: "Strong (with 2048+ bit keys)",
  },
}

export default rsaCipher
