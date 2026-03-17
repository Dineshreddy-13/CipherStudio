import { formatVigenereSteps } from "@/lib/utils"

const isLetter = (ch) => /[a-zA-Z]/.test(ch)

const repeatKeyLetters = (key, text) => {
  const letters = text.split("").filter(isLetter)
  if (!key) return ""
  const pureKey = key.replace(/[^a-zA-Z]/g, "")
  if (!pureKey) return ""
  return pureKey.repeat(Math.ceil(letters.length / pureKey.length)).slice(0, letters.length)
}

const shiftChar = (ch, keyCh, encrypt = true) => {
  const base = ch >= 'a' && ch <= 'z' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0)
  const p = ch.charCodeAt(0) - base
  const kBase = keyCh >= 'a' && keyCh <= 'z' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0)
  const k = keyCh.charCodeAt(0) - kBase

  const res = encrypt ? (p + k) % 26 : (p - k + 26) % 26
  return String.fromCharCode(res + base)
}

const vigenereCipher = {
  id: "vigenere",
  name: "Vigenere Cipher",
  type: "symmetric",

  encrypt(text, key) {
    if (!key) throw new Error("Key is required")

    const keyLetters = repeatKeyLetters(key, text)
    let keyIndex = 0
    const steps = []
    let out = ""

    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (!isLetter(ch)) {
        out += ch
        steps.push({
          title: `Step ${i + 1} — Non-letter, pass-through`,
          plaintext: `'${ch}'`,
          key: "N/A",
          operation: "non-letter character, no change",
          result: `'${ch}'`,
          explanation: "Non-letter characters pass through unchanged and don't advance the key index.",
        })
        continue
      }

      const k = keyLetters[keyIndex]
      const cipherCh = shiftChar(ch, k, true)
      out += cipherCh

      steps.push({
        title: `Step ${i + 1} — Vigenère shift`,
        plaintext: `'${ch}' → ${ch.charCodeAt(0)}`,
        key: `'${k}' → ${k.charCodeAt(0)}`,
        operation: `${ch} shift by ${k} → ${cipherCh}`,
        result: `'${cipherCh}'`,
        explanation:
          "For letters, shift plaintext by key letter (A=0..Z=25). Non-letters are unchanged.",
      })

      keyIndex += 1
    }

    const formatted = formatVigenereSteps({
      text,
      out,
      key,
      steps,
      isEncrypt: true,
    })

    return {
      output: out,
      steps: { ...formatted, summary: { plaintext: text, key, output: out } },
    }
  },

  decrypt(text, key) {
    if (!key) throw new Error("Key is required")

    const keyLetters = repeatKeyLetters(key, text)
    let keyIndex = 0
    const steps = []
    let out = ""

    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (!isLetter(ch)) {
        out += ch
        steps.push({
          title: `Step ${i + 1} — Non-letter, pass-through`,
          plaintext: `'${ch}'`,
          key: "N/A",
          operation: "non-letter character, no change",
          result: `'${ch}'`,
          explanation: "Non-letter characters pass through unchanged and don't advance the key index.",
        })
        continue
      }

      const k = keyLetters[keyIndex]
      const plainCh = shiftChar(ch, k, false)
      out += plainCh

      steps.push({
        title: `Step ${i + 1} — Reverse Vigenère shift`,
        plaintext: `'${ch}' → ${ch.charCodeAt(0)}`,
        key: `'${k}' → ${k.charCodeAt(0)}`,
        operation: `${ch} unshift by ${k} → ${plainCh}`,
        result: `'${plainCh}'`,
        explanation: "Applying the inverse shift using the same key letter restores plaintext.",
      })

      keyIndex += 1
    }

    const formatted = formatVigenereSteps({
      text: out,
      out: text,
      key,
      steps,
      isEncrypt: false,
    })

    return {
      output: out,
      steps: { ...formatted, summary: { plaintext: out, key, output: text } },
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: "O(n)",
    useCases: ["Education", "Classical cipher demos"],
    security: "Weak against modern cryptanalysis unless key is one-time random",
  },
}

export default vigenereCipher
