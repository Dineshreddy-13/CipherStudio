// algorithms/xorCipher.js
// import { formatXorSteps } from "@/utils/stepFormatter"
import { formatXorSteps } from "@/lib/utils"

const repeatKey = (key, length) => {
  if (!key) return ""
  return key.repeat(Math.ceil(length / key.length)).slice(0, length)
}

const xorCipher = {
  id: "xor",
  name: "XOR Cipher",
  type: "symmetric",

  encrypt(text, key) {
    if (!key) throw new Error("Key is required")

    const keyRep = repeatKey(key, text.length)
    const encryptedBytes = []
    const steps = []

    for (let i = 0; i < text.length; i++) {
      const t = text.charCodeAt(i)
      const k = keyRep.charCodeAt(i)
      const x = t ^ k

      encryptedBytes.push(x)

      steps.push({
        title: `Step ${i + 1} — XOR characters`,
        plaintext: `'${text[i]}' → ${t}`,
        key: `'${keyRep[i]}' → ${k}`,
        operation: `${t} ⊕ ${k} = ${x}`,
        result: x.toString(16).toUpperCase().padStart(2, "0"),
        explanation:
          "XOR outputs 1 when bits differ and 0 when they are the same. Applying XOR twice with the same key restores the original value.",
      })
    }

    const hexOut = encryptedBytes
      .map(x => x.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ")

    const formatted = formatXorSteps({
      text,
      hexOut,
      key,
      steps,
      isEncrypt: true,
    })

    return {
      output: hexOut,
      steps: { ...formatted, summary: { plaintext: text, key, output: hexOut } },
    }
  },

  decrypt(hexText, key) {
    if (!key) throw new Error("Key is required")

    const values = hexText.split(" ").map(v => parseInt(v, 16))
    const keyRep = repeatKey(key, values.length)

    let plaintext = ""
    const steps = []

    for (let i = 0; i < values.length; i++) {
      const v = values[i]
      const k = keyRep.charCodeAt(i)
      const p = v ^ k

      plaintext += String.fromCharCode(p)

      steps.push({
        title: `Step ${i + 1} — Reverse XOR`,
        plaintext: `${v.toString(16).toUpperCase()} → ${v}`,
        key: `'${keyRep[i]}' → ${k}`,
        operation: `${v} ⊕ ${k} = ${p}`,
        result: `'${String.fromCharCode(p)}'`,
        explanation:
          "XOR is reversible. Applying the same key again restores the original plaintext.",
      })
    }

    const formatted = formatXorSteps({
      text: plaintext,
      hexOut: hexText,
      key,
      steps,
      isEncrypt: false,
    })

    return {
      output: plaintext,
      steps: { ...formatted, summary: { plaintext, key, output: hexText } },
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: "O(n)",
    useCases: ["Education", "Stream cipher basis", "One-time pad"],
    security: "Weak (unless used as one-time pad)",
  },
}

export default xorCipher
