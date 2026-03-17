import { formatDiffieHellmanSteps } from "@/lib/utils"

// Standard primes and generators for DH (using larger primes suitable for ASCII encryption)
const DH_PRIMES = {
  small: {
    p: 257n,  // Prime larger than all ASCII values (0-255)
    g: 3n,
    bits: 8,
  },
  medium: {
    p: 65521n,  // Large prime suitable for extended character support
    g: 2n,
    bits: 16,
  },
  large: {
    p: 2147483647n,  // Mersenne prime (2^31 - 1), very large
    g: 2n,
    bits: 31,
  },
}

const diffieHellmanCipher = {
  id: "diffie-hellman",
  name: "Diffie-Hellman Key Exchange",
  type: "asymmetric",

  generateParameters(keySize = "medium") {
    const params = DH_PRIMES[keySize] || DH_PRIMES.medium
    return {
      p: params.p.toString(),
      g: params.g.toString(),
      keySize,
    }
  },

  // Generate a key pair for Diffie-Hellman (RSA-style encryption)
  generateKeys(keySize = "medium") {
    const params = this.generateParameters(keySize)
    const p = BigInt(params.p)
    const g = BigInt(params.g)
    const phi = p - 1n // φ(p) = p-1 for prime p

    // Keep trying until we get a valid key pair
    // (where e and phi are coprime, so modular inverse exists)
    let attempt = 0
    const maxAttempts = 100
    
    while (attempt < maxAttempts) {
      try {
        const a = BigInt(this.generatePrivateKey(params.p))
        const A = modPow(g, a, p) // publicExponent = g^a mod p

        // Try to compute the modular inverse
        // This will throw if gcd(A, phi) !== 1
        const d = modInverse(A, phi)

        // If we got here, the key pair is valid
        return {
          publicKey: {
            p: p.toString(),
            e: A.toString(), // encryption exponent = g^a mod p
          },
          privateKey: {
            p: p.toString(),
            d: d.toString(), // decryption exponent = modInverse(e, p-1)
          },
        }
      } catch (error) {
        // This key pair is invalid, try again
        attempt++
        if (attempt >= maxAttempts) {
          throw new Error(`Failed to generate valid keys after ${maxAttempts} attempts`)
        }
      }
    }
  },

  generatePrivateKey(p) {
    const pNum = BigInt(p)
    // Generate random private key between 2 and p-2
    const min = 2n
    const max = pNum - 2n
    const range = max - min + 1n
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    let randomBigInt = 0n
    for (let i = 0; i < randomBytes.length; i++) {
      randomBigInt = (randomBigInt << 8n) | BigInt(randomBytes[i])
    }
    const privateKey = (randomBigInt % range) + min
    return privateKey.toString()
  },

  computePublicKey(p, g, privateKey) {
    const pNum = BigInt(p)
    const gNum = BigInt(g)
    const privNum = BigInt(privateKey)

    // Compute g^privateKey mod p
    const publicKey = modPow(gNum, privNum, pNum)
    return publicKey.toString()
  },

  computeSharedSecret(p, publicKeyOther, privateKey) {
    const pNum = BigInt(p)
    const pubKeyNum = BigInt(publicKeyOther)
    const privNum = BigInt(privateKey)

    // Compute publicKeyOther^privateKey mod p
    const sharedSecret = modPow(pubKeyNum, privNum, pNum)
    return sharedSecret.toString()
  },

  // Party A: Initialize and get public key
  initiateKeyExchange(keySize = "medium") {
    try {
      const params = this.generateParameters(keySize)
      const p = params.p
      const g = params.g
      const privateKeyA = this.generatePrivateKey(p)
      const publicKeyA = this.computePublicKey(p, g, privateKeyA)

      const steps = [
        {
          title: "Step 1 — Select Prime and Generator",
          plaintext: `Parameters`,
          key: `p = ${p}, g = ${g}`,
          operation: `Choose public parameters (prime p and generator g)`,
          result: `Prime: ${p}, Generator: ${g}`,
          explanation: "Diffie-Hellman uses a large prime p and generator g (public knowledge).",
        },
        {
          title: "Step 2 — Generate Private Key (Party A)",
          plaintext: `Random number`,
          key: `2 < a < ${p}`,
          operation: `Generate random private key a`,
          result: `Private Key a = ${privateKeyA}`,
          explanation: "Party A generates a random private key a, kept secret.",
        },
        {
          title: "Step 3 — Compute Public Key (Party A)",
          plaintext: `Public parameters`,
          key: `Private Key: ${privateKeyA}`,
          operation: `Calculate A = g^a mod p = ${g}^${privateKeyA} mod ${p}`,
          result: `Public Key A = ${publicKeyA}`,
          explanation: "Party A computes public key A = g^a mod p using their private key.",
        },
        {
          title: "Step 4 — Transmit Public Key (Party A)",
          plaintext: `Public Key A = ${publicKeyA}`,
          key: `p = ${p}, g = ${g}`,
          operation: `Send A (public) over insecure channel`,
          result: `Shared: A = ${publicKeyA}`,
          explanation: "Party A sends public key A to Party B along with p and g (can be public).",
        },
      ]

      const formatted = formatDiffieHellmanSteps({
        stage: "Party A - Initiation",
        params: { p, g },
        privateKey: privateKeyA,
        publicKey: publicKeyA,
        steps,
        isInitiation: true,
      })

      return {
        output: JSON.stringify({ p, g, publicKeyA, privateKeyA }),
        steps: formatted,
        p,
        g,
        publicKeyA,
        privateKeyA,
      }
    } catch (error) {
      throw new Error(`DH initiation failed: ${error.message}`)
    }
  },

  // Party B: Respond and establish shared secret
  respondKeyExchange(p, g, publicKeyA, keySize = "medium") {
    try {
      const privateKeyB = this.generatePrivateKey(p)
      const publicKeyB = this.computePublicKey(p, g, privateKeyB)
      const sharedSecret = this.computeSharedSecret(p, publicKeyA, privateKeyB)

      const steps = [
        {
          title: "Step 1 — Receive Public Parameters",
          plaintext: `Parameters`,
          key: `p = ${p}, g = ${g}, A = ${publicKeyA}`,
          operation: `Receive p, g, and public key A from Party A`,
          result: `Received: p = ${p}, g = ${g}, A = ${publicKeyA}`,
          explanation: "Party B receives the public parameters and Party A's public key.",
        },
        {
          title: "Step 2 — Generate Private Key (Party B)",
          plaintext: `Random number`,
          key: `2 < b < ${p}`,
          operation: `Generate random private key b`,
          result: `Private Key b = ${privateKeyB}`,
          explanation: "Party B generates a random private key b, kept secret.",
        },
        {
          title: "Step 3 — Compute Public Key (Party B)",
          plaintext: `Public parameters`,
          key: `Private Key: ${privateKeyB}`,
          operation: `Calculate B = g^b mod p = ${g}^${privateKeyB} mod ${p}`,
          result: `Public Key B = ${publicKeyB}`,
          explanation: "Party B computes public key B = g^b mod p using their private key.",
        },
        {
          title: "Step 4 — Compute Shared Secret (Party B)",
          plaintext: `Public Key A = ${publicKeyA}`,
          key: `Private Key b = ${privateKeyB}`,
          operation: `Calculate S = A^b mod p = ${publicKeyA}^${privateKeyB} mod ${p}`,
          result: `Shared Secret S = ${sharedSecret}`,
          explanation: "Party B computes shared secret S = A^b mod p using A and private key b.",
        },
        {
          title: "Step 5 — Transmit Public Key (Party B)",
          plaintext: `Public Key B = ${publicKeyB}`,
          key: `p = ${p}, g = ${g}`,
          operation: `Send B (public) over insecure channel`,
          result: `Shared: B = ${publicKeyB}`,
          explanation: "Party B sends public key B to Party A (can be sent over insecure channel).",
        },
      ]

      const formatted = formatDiffieHellmanSteps({
        stage: "Party B - Response & Agreement",
        params: { p, g },
        publicKeyA,
        privateKeyB,
        publicKeyB,
        sharedSecret,
        steps,
        isResponse: true,
      })

      return {
        output: JSON.stringify({ publicKeyB, sharedSecret }),
        steps: formatted,
        publicKeyB,
        sharedSecret,
      }
    } catch (error) {
      throw new Error(`DH response failed: ${error.message}`)
    }
  },

  // Party A: Compute shared secret
  finalizeKeyExchange(p, publicKeyB, privateKeyA) {
    try {
      const sharedSecret = this.computeSharedSecret(p, publicKeyB, privateKeyA)

      const steps = [
        {
          title: "Step 1 — Receive Public Key (Party A)",
          plaintext: `Public Key B = ${publicKeyB}`,
          key: `p = ${p}`,
          operation: `Receive public key B from Party B`,
          result: `Received: B = ${publicKeyB}`,
          explanation: "Party A receives Party B's public key B.",
        },
        {
          title: "Step 2 — Compute Shared Secret (Party A)",
          plaintext: `Public Key B = ${publicKeyB}`,
          key: `Private Key a = ${privateKeyA}`,
          operation: `Calculate S = B^a mod p = ${publicKeyB}^${privateKeyA} mod ${p}`,
          result: `Shared Secret S = ${sharedSecret}`,
          explanation: "Party A computes shared secret S = B^a mod p using B and private key a.",
        },
        {
          title: "Step 3 — Verify Secret Agreement",
          plaintext: `Shared Secret: ${sharedSecret}`,
          key: `Both parties computed same secret`,
          operation: `Both A and B now have same shared secret`,
          result: `Agreement established: S = ${sharedSecret}`,
          explanation: "Both parties now possess the same shared secret without transmitting it.",
        },
      ]

      const formatted = formatDiffieHellmanSteps({
        stage: "Party A - Finalization",
        params: { p },
        publicKeyB,
        privateKeyA,
        sharedSecret,
        steps,
        isFinalization: true,
      })

      return {
        output: JSON.stringify({ sharedSecret }),
        steps: formatted,
        sharedSecret,
      }
    } catch (error) {
      throw new Error(`DH finalization failed: ${error.message}`)
    }
  },

  meta: {
    requiresKey: false,
    supportsSteps: true,
    complexity: "O(log n)",
    useCases: ["Key exchange", "Establishing secure channels"],
    security: "Strong - basis for TLS/SSL handshake",
  },

  // Encrypt using public key
  async encrypt(plaintext, publicKeyObj) {
    try {
      if (!plaintext) throw new Error("Plaintext is required")
      if (!publicKeyObj) throw new Error("Public key is required")
      
      // Validate that publicKeyObj has the required properties
      if (!publicKeyObj.p || !publicKeyObj.e) {
        throw new Error(`Invalid public key format. Missing properties: ${!publicKeyObj.p ? 'p' : ''} ${!publicKeyObj.e ? 'e' : ''}`)
      }
      
      const p = BigInt(publicKeyObj.p)
      const e = BigInt(publicKeyObj.e)

      // Encrypt each character: C[i] = plaintext[i]^e mod p
      const ciphertext = []
      for (let i = 0; i < plaintext.length; i++) {
        const m = BigInt(plaintext.charCodeAt(i))
        const c = modPow(m, e, p)
        ciphertext.push(c.toString(16).padStart(4, '0'))
      }

      const output = ciphertext.join('')

      const steps = [
        {
          title: "Step 1 — Prepare Plaintext",
          plaintext: plaintext,
          key: `e = ${e.toString()}`,
          operation: "Convert each character to ASCII value",
          result: `Characters: ${Array.from(plaintext).map(c => c.charCodeAt(0)).join(', ')}`,
          explanation: "Each character in the plaintext is converted to its ASCII value.",
        },
        {
          title: "Step 2 — Encrypt with Public Key",
          plaintext: plaintext,
          key: `e = ${e.toString()}, p = ${p.toString()}`,
          operation: `For each char M: C = M^e mod p`,
          result: `Ciphertext: ${output}`,
          explanation: `Each ASCII value is raised to the power of the public exponent (${e.toString()}) modulo the prime (${p.toString()}).`,
        },
        {
          title: "Step 3 — Encode as Hex",
          plaintext: `Encrypted values`,
          key: "Hex encoding",
          operation: "Convert encrypted values to hexadecimal",
          result: `Hex: ${output}`,
          explanation: "The encrypted values are converted to hexadecimal for safe transmission.",
        },
      ]

      return {
        output,
        steps: formatDiffieHellmanSteps({
          stage: "Encryption",
          steps,
        }),
      }
    } catch (error) {
      throw new Error(`DH encryption failed: ${error.message}`)
    }
  },

  // Decrypt using private key
  async decrypt(ciphertext, privateKeyObj) {
    try {
      if (!ciphertext) throw new Error("Ciphertext is required")
      if (!privateKeyObj) throw new Error("Private key is required")
      
      // Validate that privateKeyObj has the required properties
      if (!privateKeyObj.p || !privateKeyObj.d) {
        throw new Error(`Invalid private key format. Missing properties: ${!privateKeyObj.p ? 'p' : ''} ${!privateKeyObj.d ? 'd' : ''}`)
      }
      
      const p = BigInt(privateKeyObj.p)
      const d = BigInt(privateKeyObj.d)

      // Parse hex-encoded ciphertext
      const hexChunks = ciphertext.match(/.{1,4}/g) || []
      if (hexChunks.length === 0) throw new Error("Invalid ciphertext format")

      // Decrypt each chunk: M[i] = ciphertext[i]^d mod p
      const plaintext = []
      for (let i = 0; i < hexChunks.length; i++) {
        const c = BigInt('0x' + hexChunks[i])
        const m = modPow(c, d, p)
        plaintext.push(String.fromCharCode(Number(m)))
      }

      const output = plaintext.join('')

      const steps = [
        {
          title: "Step 1 — Parse Ciphertext",
          plaintext: ciphertext,
          key: `d = ${d.toString()}`,
          operation: "Convert hex chunks back to numbers",
          result: `Chunks: ${hexChunks.join(', ')}`,
          explanation: "The hexadecimal ciphertext is split into chunks and converted back to numbers.",
        },
        {
          title: "Step 2 — Decrypt with Private Key",
          plaintext: `Encrypted chunks`,
          key: `d = ${d.toString()}, p = ${p.toString()}`,
          operation: `For each cipher C: M = C^d mod p`,
          result: `Plaintext: ${output}`,
          explanation: `Each encrypted value is raised to the power of the private exponent (${d.toString()}) modulo the prime (${p.toString()}).`,
        },
        {
          title: "Step 3 — Convert to Characters",
          plaintext: output,
          key: "ASCII decoding",
          operation: "Convert ASCII values back to characters",
          result: `Plaintext: ${output}`,
          explanation: "The decrypted ASCII values are converted back to characters to retrieve the original message.",
        },
      ]

      return {
        output,
        steps: formatDiffieHellmanSteps({
          stage: "Decryption",
          steps,
        }),
      }
    } catch (error) {
      throw new Error(`DH decryption failed: ${error.message}`)
    }
  },
}

// Helper function for modular exponentiation
function modPow(base, exp, mod) {
  let result = 1n
  base = base % mod
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod
    }
    exp = exp >> 1n
    base = (base * base) % mod
  }
  return result
}

// Helper function for greatest common divisor
function gcd(a, b) {
  while (b !== 0n) {
    let temp = b
    b = a % b
    a = temp
  }
  return a
}

// Helper function for modular inverse using Extended Euclidean Algorithm
function modInverse(a, m) {
  // Check if modular inverse exists
  if (gcd(a, m) !== 1n) {
    throw new Error("a and m must be coprime for modular inverse to exist")
  }

  let [old_r, r] = [a, m]
  let [old_s, s] = [1n, 0n]

  while (r !== 0n) {
    let quotient = old_r / r
    ;[old_r, r] = [r, old_r - quotient * r]
    ;[old_s, s] = [s, old_s - quotient * s]
  }

  if (old_s < 0n) old_s = old_s + m
  return old_s
}

export default diffieHellmanCipher
