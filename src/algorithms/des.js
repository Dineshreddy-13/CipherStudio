// Refined educational Simplified-DES (S-DES) implementation for visualization.
// Note: This is NOT the real DES and is for teaching/demonstration only.

const toBits = (num, len) => {
  const bits = []
  for (let i = len - 1; i >= 0; i--) bits.push((num >> i) & 1)
  return bits
}

const bitsToNumber = (bits) => bits.reduce((acc, b) => (acc << 1) | b, 0)

const permute = (bits, table) => table.map(i => bits[i - 1])

const leftShift = (bits, n) => bits.slice(n).concat(bits.slice(0, n))

// S-Boxes from S-DES
const S0 = [
  [1,0,3,2],
  [3,2,1,0],
  [0,2,1,3],
  [3,1,3,2],
]

const S1 = [
  [0,1,2,3],
  [2,0,1,3],
  [3,0,1,0],
  [2,1,0,3],
]

const sboxLookup = (box, bits) => {
  const row = (bits[0] << 1) | bits[3]
  const col = (bits[1] << 1) | bits[2]
  return toBits(box[row][col], 2)
}

// Key schedule: produce two 8-bit subkeys from a 10-bit key
const generateSubkeys = (raw10) => {
  // Permutation P10
  const P10 = [3,5,2,7,4,10,1,9,8,6]
  const P8 = [6,3,7,4,8,5,10,9]

  let bits = toBits(raw10, 10)
  bits = permute(bits, P10)
  let left = bits.slice(0,5)
  let right = bits.slice(5)

  left = leftShift(left, 1)
  right = leftShift(right, 1)
  const k1 = bitsToNumber(permute([...left, ...right], P8))

  left = leftShift(left, 2)
  right = leftShift(right, 2)
  const k2 = bitsToNumber(permute([...left, ...right], P8))

  return [k1, k2]
}

const fk = (left4, right4, subkey) => {
  // Expansion/permutation EP: 4 -> 8
  const EP = [4,1,2,3,2,3,4,1]
  const P4 = [2,4,3,1]

  const expanded = permute(right4, EP)
  const subkeyBits = toBits(subkey, 8)
  const xored = expanded.map((b,i) => b ^ subkeyBits[i])

  const leftX = xored.slice(0,4)
  const rightX = xored.slice(4)

  const s0 = sboxLookup(S0, leftX)
  const s1 = sboxLookup(S1, rightX)

  const combined = [...s0, ...s1]
  const p4 = permute(combined, P4)

  const result = left4.map((b,i) => b ^ p4[i])
  return result
}

const sdesEncryptByte = (byte, subkeys) => {
  // IP and IP inverse tables
  const IP = [2,6,3,1,4,8,5,7]
  const IP_INV = [4,1,3,5,7,2,8,6]

  const bits = toBits(byte, 8)
  let perm = permute(bits, IP)
  let left = perm.slice(0,4)
  let right = perm.slice(4)

  // Round 1 with K1
  const out1 = fk(left, right, subkeys[0])
  let newLeft = right
  let newRight = out1

  // Round 2 with K2
  const out2 = fk(newLeft, newRight, subkeys[1])
  const preoutput = [...out2, ...newRight]

  const cipherBits = permute(preoutput, IP_INV)
  return bitsToNumber(cipherBits)
}

const sdesDecryptByte = (byte, subkeys) => {
  const IP = [2,6,3,1,4,8,5,7]
  const IP_INV = [4,1,3,5,7,2,8,6]

  const bits = toBits(byte, 8)
  let perm = permute(bits, IP)
  let left = perm.slice(0,4)
  let right = perm.slice(4)

  // Reverse order of subkeys
  const out1 = fk(left, right, subkeys[1])
  let newLeft = right
  let newRight = out1

  const out2 = fk(newLeft, newRight, subkeys[0])
  const preoutput = [...out2, ...newRight]

  const plainBits = permute(preoutput, IP_INV)
  return bitsToNumber(plainBits)
}

// Derive a stable 10-bit key integer from user key string
const derive10BitKey = (keyStr) => {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(keyStr)
  // Fold bytes into a 10-bit value
  let acc = 0
  for (let i = 0; i < bytes.length; i++) acc = (acc << 3) ^ bytes[i]
  return acc & 0x3ff // 10 bits
}

const desCipher = {
  id: 'des',
  name: 'DES (S-DES)',
  type: 'symmetric',

  async encrypt(plaintext, key) {
    if (plaintext == null || key == null) throw new Error('Text and key are required')
    const encoder = new TextEncoder()
    const input = encoder.encode(plaintext)

    const key10 = derive10BitKey(key)
    const [k1, k2] = generateSubkeys(key10)

    const steps = []
    steps.push({ title: 'Key Schedule', operation: 'Generate K1 and K2 from 10-bit key', key: `Raw10: 0x${key10.toString(16)}`, result: `K1=0x${k1.toString(16)}, K2=0x${k2.toString(16)}` })

    const outBytes = []
    for (let i = 0; i < input.length; i++) {
      const b = input[i]
      const before = b.toString(16).padStart(2,'0')
      const cipher = sdesEncryptByte(b, [k1,k2])
      outBytes.push(cipher & 0xff)
      steps.push({ title: `Encrypt byte ${i+1}`, operation: `Encrypt 8-bit block`, result: `0x${before} -> 0x${cipher.toString(16).padStart(2,'0')}`, explanation: 'Using IP, two rounds with S-boxes, and IP^-1' })
    }

    const output = btoa(String.fromCharCode(...outBytes))

    return {
      output,
      steps: {
        kind: 'des',
        mode: 'encrypt',
        title: 'S-DES Encryption Process',
        summary: { plaintext, key, output },
        steps,
        keySchedule: [ { round: 1, subkey: `0x${k1.toString(16)}` }, { round: 2, subkey: `0x${k2.toString(16)}` } ],
      },
    }
  },

  async decrypt(ciphertext, key) {
    if (ciphertext == null || key == null) throw new Error('Text and key are required')
    const bytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    const key10 = derive10BitKey(key)
    const [k1, k2] = generateSubkeys(key10)

    const steps = []
    steps.push({ title: 'Key Schedule', operation: 'Generate K1 and K2 from 10-bit key', key: `Raw10: 0x${key10.toString(16)}`, result: `K1=0x${k1.toString(16)}, K2=0x${k2.toString(16)}` })

    const outBytes = []
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i]
      const before = b.toString(16).padStart(2,'0')
      const plain = sdesDecryptByte(b, [k1,k2])
      outBytes.push(plain & 0xff)
      steps.push({ title: `Decrypt byte ${i+1}`, operation: `Decrypt 8-bit block`, result: `0x${before} -> 0x${plain.toString(16).padStart(2,'0')}`, explanation: 'Apply IP, reverse rounds, IP^-1' })
    }

    const decoder = new TextDecoder()
    const output = decoder.decode(Uint8Array.from(outBytes))

    return {
      output,
      steps: {
        kind: 'des',
        mode: 'decrypt',
        title: 'S-DES Decryption Process',
        summary: { plaintext: output, key, output: ciphertext },
        steps,
        keySchedule: [ { round: 1, subkey: `0x${k1.toString(16)}` }, { round: 2, subkey: `0x${k2.toString(16)}` } ],
      },
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: 'O(n)',
    useCases: ['Educational / Visualization'],
    security: 'Educational only - not secure',
  },
}

export default desCipher
