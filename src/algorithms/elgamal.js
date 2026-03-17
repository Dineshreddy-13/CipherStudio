import { formatElgamalSteps } from "@/lib/utils"

// Reuse primes similar to Diffie-Hellman for simplicity
const ELG_PRIMES = {
  small: { p: 257n, g: 3n },
  medium: { p: 65521n, g: 2n },
  large: { p: 2147483647n, g: 2n },
}

const elgamalCipher = {
  id: "elgamal",
  name: "ElGamal Encryption",
  type: "asymmetric",

  generateParameters(size = "medium") {
    const params = ELG_PRIMES[size] || ELG_PRIMES.medium
    return { p: params.p.toString(), g: params.g.toString(), size }
  },

  // Generate keypair: private x, public h = g^x mod p
  generateKeys(size = "medium") {
    const params = this.generateParameters(size)
    const p = BigInt(params.p)
    const g = BigInt(params.g)

    const x = BigInt(this._randomBetween(2n, p - 2n))
    const h = modPow(g, x, p)

    return {
      publicKey: { p: p.toString(), g: g.toString(), h: h.toString() },
      privateKey: { p: p.toString(), x: x.toString() },
    }
  },

  _randomBetween(min, max) {
    const range = max - min + 1n
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    let r = 0n
    for (let i = 0; i < bytes.length; i++) r = (r << 8n) | BigInt(bytes[i])
    return (r % range) + min
  },

  // Encrypt each character producing pair (c1, c2)
  async encrypt(plaintext, publicKeyObj) {
    try {
      if (!plaintext) throw new Error("Plaintext is required")
      if (!publicKeyObj) throw new Error("Public key is required")

      if (!publicKeyObj.p || !publicKeyObj.g || !publicKeyObj.h) {
        throw new Error("Invalid public key format. Expected p, g, h")
      }

      const p = BigInt(publicKeyObj.p)
      const g = BigInt(publicKeyObj.g)
      const h = BigInt(publicKeyObj.h)

      const ciphertext = []
      const steps = []

      for (let i = 0; i < plaintext.length; i++) {
        const m = BigInt(plaintext.charCodeAt(i))
        const y = this._randomBetween(2n, p - 2n)
        const c1 = modPow(g, y, p)
        const s = modPow(h, y, p) // h^y
        const c2 = (m * s) % p

        // store as hex chunks padded to 4 (p small primes fit 2 bytes)
        const c1hex = c1.toString(16).padStart(4, "0")
        const c2hex = c2.toString(16).padStart(4, "0")
        ciphertext.push(c1hex + c2hex)

        steps.push({
          title: `Char ${i + 1}`,
          plaintext: String.fromCharCode(Number(m)),
          key: `p=${p}, g=${g}, h=${h}`,
          operation: `Pick y=${y}; c1=g^y mod p; c2=m*h^y mod p`,
          result: `c1=${c1} c2=${c2}`,
          explanation: "ElGamal encrypts each message symbol with ephemeral randomness y.",
        })
      }

      const output = ciphertext.join("")

      return {
        output,
        steps: formatElgamalSteps({ steps, mode: "encrypt", plaintext, output }),
      }
    } catch (err) {
      throw new Error(`ElGamal encryption failed: ${err.message}`)
    }
  },

  // Decrypt expects concatenated pairs per character (each pair 8 hex chars)
  async decrypt(ciphertext, privateKeyObj) {
    try {
      if (!ciphertext) throw new Error("Ciphertext is required")
      if (!privateKeyObj) throw new Error("Private key is required")

      if (!privateKeyObj.p || !privateKeyObj.x) {
        throw new Error("Invalid private key format. Expected p and x")
      }

      const p = BigInt(privateKeyObj.p)
      const x = BigInt(privateKeyObj.x)

      const chunks = ciphertext.match(/.{1,8}/g) || []
      if (chunks.length === 0) throw new Error("Invalid ciphertext format")

      const plaintextChars = []
      const steps = []

      for (let i = 0; i < chunks.length; i++) {
        const c1 = BigInt('0x' + chunks[i].slice(0, 4))
        const c2 = BigInt('0x' + chunks[i].slice(4, 8))

        const s = modPow(c1, x, p) // c1^x = g^{yx} = h^y
        const sInv = modInverse(s, p)
        const m = (c2 * sInv) % p

        plaintextChars.push(String.fromCharCode(Number(m)))

        steps.push({
          title: `Chunk ${i + 1}`,
          plaintext: chunks[i],
          key: `p=${p}, x=${x}`,
          operation: `s = c1^x mod p; m = c2 * s^{-1} mod p`,
          result: `m=${m}`,
          explanation: "ElGamal decryption recovers m by removing the ephemeral factor.",
        })
      }

      const output = plaintextChars.join("")

      return {
        output,
        steps: formatElgamalSteps({ steps, mode: "decrypt", ciphertext, output }),
      }
    } catch (err) {
      throw new Error(`ElGamal decryption failed: ${err.message}`)
    }
  },

  meta: {
    requiresKey: false,
    supportsSteps: true,
    complexity: "O(log n)",
    useCases: ["Message encryption with ephemeral keys"],
  },
}

// Helper modular exponentiation
function modPow(base, exp, mod) {
  let result = 1n
  base = base % mod
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod
    exp = exp >> 1n
    base = (base * base) % mod
  }
  return result
}

function gcd(a, b) {
  while (b !== 0n) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function modInverse(a, m) {
  if (gcd(a, m) !== 1n) throw new Error('No modular inverse')
  let [old_r, r] = [a, m]
  let [old_s, s] = [1n, 0n]
  while (r !== 0n) {
    const q = old_r / r
    ;[old_r, r] = [r, old_r - q * r]
    ;[old_s, s] = [s, old_s - q * s]
  }
  if (old_s < 0n) old_s += m
  return old_s
}

export default elgamalCipher
