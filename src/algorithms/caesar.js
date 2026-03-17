import { formatCaesarSteps } from "@/lib/utils"

const isLetter = (ch) => /[a-zA-Z]/.test(ch)

const shiftChar = (ch, shift, encrypt = true) => {
  const base = ch >= 'a' && ch <= 'z' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0)
  const p = ch.charCodeAt(0) - base
  const s = encrypt ? shift : -shift
  const res = (p + s + 26 * 10) % 26
  return String.fromCharCode(res + base)
}

const caesarCipher = {
  id: "caesar",
  name: "Caesar Cipher",
  type: "symmetric",

  encrypt(text, key) {
    const shift = parseInt(key, 10) || 0
    if (shift < 0 || shift > 25) throw new Error("Shift must be between 0 and 25")

    let out = ""
    const steps = []

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
          explanation: "Non-letter characters pass through unchanged.",
        })
        continue
      }

      const cipherCh = shiftChar(ch, shift, true)
      out += cipherCh

      steps.push({
        title: `Step ${i + 1} — Caesar shift`,
        plaintext: `'${ch}' → ${ch.charCodeAt(0)}`,
        key: `shift=${shift}`,
        operation: `${ch} shift by ${shift} → ${cipherCh}`,
        result: `'${cipherCh}'`,
        explanation: `Shift '${ch}' forward by ${shift} positions in the alphabet.`,
      })
    }

    const formatted = formatCaesarSteps({
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
    const shift = parseInt(key, 10) || 0
    if (shift < 0 || shift > 25) throw new Error("Shift must be between 0 and 25")

    let out = ""
    const steps = []

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
          explanation: "Non-letter characters pass through unchanged.",
        })
        continue
      }

      const plainCh = shiftChar(ch, shift, false)
      out += plainCh

      steps.push({
        title: `Step ${i + 1} — Reverse Caesar shift`,
        plaintext: `'${ch}' → ${ch.charCodeAt(0)}`,
        key: `shift=${shift}`,
        operation: `${ch} unshift by ${shift} → ${plainCh}`,
        result: `'${plainCh}'`,
        explanation: `Shift '${ch}' backward by ${shift} positions to recover plaintext.`,
      })
    }

    const formatted = formatCaesarSteps({
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
    useCases: ["Education", "Historical cipher demos"],
    security: "Extremely weak - brute-forceable with 26 keys",
  },
}

export default caesarCipher
