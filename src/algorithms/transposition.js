import { formatTranspositionSteps } from "@/lib/utils"

const sanitize = (s) => s.replace(/\s+/g, "")

// Determine numeric order of key characters (handles duplicates by index)
const keyOrder = (key) => {
  const arr = key.split("").map((ch, i) => ({ ch, i }))
  const sorted = [...arr].sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i))
  // map original index -> rank
  const order = new Array(arr.length)
  sorted.forEach((item, rank) => { order[item.i] = rank })
  return order
}

const transpositionCipher = {
  id: "transposition",
  name: "Columnar Transposition",
  type: "symmetric",

  encrypt(plaintext, key) {
    if (!key) throw new Error("Key is required")
    const text = sanitize(String(plaintext))
    const cols = key.length
    const order = keyOrder(key)

    // Fill rows left-to-right
    const rows = []
    for (let i = 0; i < text.length; i += cols) {
      rows.push(text.slice(i, i + cols).split(""))
    }

    // pad last row
    const last = rows[rows.length - 1]
    if (last && last.length < cols) {
      while (last.length < cols) last.push("X")
    }

    const steps = []

    // step: show matrix
    steps.push({
      title: "Build matrix (row-wise)",
      plaintext: text,
      key,
      operation: `Fill rows with ${cols} columns`,
      result: rows.map(r => r.join("")).join(" | "),
      explanation: "Plaintext is written row-by-row into a matrix with columns equal to key length. Pad with 'X' if needed.",
      matrix: rows,
    })

    // read columns by key order
    const colsRead = new Array(cols).fill("")
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows.length; r++) {
        colsRead[c] += (rows[r][c] ?? "")
      }
    }

    const ordered = []
    for (let i = 0; i < cols; i++) {
      // find column index with rank i
      const colIdx = order.indexOf(i)
      ordered.push({ idx: colIdx, text: colsRead[colIdx] })
      steps.push({
        title: `Read column ${i + 1} (order ${colIdx + 1})`,
        plaintext: colsRead[colIdx],
        key,
        operation: `Read down column at index ${colIdx}`,
        result: colsRead[colIdx],
        explanation: `Columns are read in key-sorted order to form ciphertext part.`,
      })
    }

    const ciphertext = ordered.map(o => o.text).join("")

    return {
      output: ciphertext,
      steps: formatTranspositionSteps({ text: plaintext, out: ciphertext, key, steps, isEncrypt: true }),
    }
  },

  decrypt(ciphertext, key) {
    if (!key) throw new Error("Key is required")
    const text = String(ciphertext)
    const cols = key.length
    const order = keyOrder(key)

    // determine number of rows
    const rowsCount = Math.ceil(text.length / cols)

    // calculate column lengths (some columns may be shorter if padded differently)
    const base = Math.floor(text.length / cols)
    const extra = text.length % cols

    const colLens = new Array(cols).fill(base)
    for (let i = 0; i < extra; i++) colLens[i] += 1

    // allocate columns in key order
    const colsArr = new Array(cols)
    let pos = 0
    for (let rank = 0; rank < cols; rank++) {
      const colIdx = order.indexOf(rank)
      const len = colLens[rank]
      colsArr[colIdx] = text.slice(pos, pos + len).split("")
      pos += len
    }

    // rebuild rows by reading row-wise
    const rows = []
    for (let r = 0; r < rowsCount; r++) {
      const row = []
      for (let c = 0; c < cols; c++) row.push(colsArr[c][r] ?? "")
      rows.push(row)
    }

    const steps = []
    steps.push({
      title: "Distribute ciphertext into columns (key order)",
      plaintext: text,
      key,
      operation: "Split ciphertext into columns according to key order and column lengths",
      result: colsArr.map(col => col.join("")).join(" | "),
      explanation: "Ciphertext is divided into columns based on the original key order; then the matrix is reconstructed row-wise.",
      matrix: rows,
    })

    const plaintext = rows.map(r => r.join("")).join("").replace(/X+$/g, "")

    steps.push({
      title: "Read rows to recover plaintext",
      plaintext: rows.map(r => r.join("")).join(" | "),
      key,
      operation: "Read matrix row-by-row",
      result: plaintext,
      explanation: "Reconstruct the plaintext by reading the matrix row-wise and stripping padding.",
    })

    return {
      output: plaintext,
      steps: formatTranspositionSteps({ text: plaintext, out: ciphertext, key, steps, isEncrypt: false }),
    }
  },

  meta: {
    requiresKey: true,
    supportsSteps: true,
    complexity: "O(n)",
    useCases: ["Education", "Classical cipher demos"],
    security: "Weak (classical)",
  },
}

export default transpositionCipher
