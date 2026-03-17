import { formatPlayfairSteps } from "@/lib/utils"

const sanitize = (s) => s.toUpperCase().replace(/J/g, "I").replace(/[^A-Z]/g, "")

const buildTable = (key) => {
  const seen = new Set()
  const table = []
  const add = (ch) => { if (!seen.has(ch)) { seen.add(ch); table.push(ch) } }

  const ks = sanitize(key)
  for (const ch of ks) add(ch)

  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ" // J merged with I
  for (const ch of alphabet) add(ch)

  // produce 5x5
  const grid = []
  for (let r = 0; r < 5; r++) grid.push(table.slice(r * 5, r * 5 + 5))
  return grid
}

const findPos = (grid, ch) => {
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (grid[r][c] === ch) return [r, c]
  return null
}

const prepareDigraphs = (text) => {
  const s = sanitize(text)
  const digraphs = []
  let i = 0
  while (i < s.length) {
    const a = s[i]
    const b = s[i + 1]
    if (!b) { digraphs.push([a, 'X']); i += 1; continue }
    if (a === b) { digraphs.push([a, 'X']); i += 1; continue }
    digraphs.push([a, b]); i += 2
  }
  return digraphs
}

const playfairCipher = {
  id: "playfair",
  name: "Playfair Cipher",
  type: "symmetric",

  encrypt(text, key) {
    if (!key) throw new Error("Key is required")
    const grid = buildTable(key)
    const digraphs = prepareDigraphs(text)
    const steps = []
    let out = ""

    for (let i = 0; i < digraphs.length; i++) {
      const [a, b] = digraphs[i]
      const [ar, ac] = findPos(grid, a)
      const [br, bc] = findPos(grid, b)
      let r1, c1, r2, c2

      if (ar === br) {
        // same row -> right
        r1 = ar; r2 = br
        c1 = (ac + 1) % 5; c2 = (bc + 1) % 5
      } else if (ac === bc) {
        // same column -> down
        c1 = ac; c2 = bc
        r1 = (ar + 1) % 5; r2 = (br + 1) % 5
      } else {
        r1 = ar; c1 = bc
        r2 = br; c2 = ac
      }

      const rchar1 = grid[r1][c1]
      const rchar2 = grid[r2][c2]
      out += rchar1 + rchar2

      steps.push({
        title: `Pair ${i + 1} — Playfair rules`,
        plaintext: `${a}${b}`,
        key: "Grid-based",
        operation: `positions: ${a}(${ar},${ac}), ${b}(${br},${bc}) → apply Playfair`,
        result: `${rchar1}${rchar2}`,
        explanation: "Playfair substitution based on grid positions: same row → shift right, same column → shift down, rectangle → swap columns.",
      })
    }

    const formatted = formatPlayfairSteps({ text, out, key, steps, isEncrypt: true })
    return {
      output: out,
      steps: { ...formatted, summary: { plaintext: text, key, output: out }, matrix: grid },
      info: { id: playfairCipher.id, name: playfairCipher.name, meta: playfairCipher.meta },
    }
  },

  decrypt(text, key) {
    if (!key) throw new Error("Key is required")
    const grid = buildTable(key)
    const s = sanitize(text)
    const digraphs = []
    for (let i = 0; i < s.length; i += 2) digraphs.push([s[i], s[i+1] ?? 'X'])
    const steps = []
    let out = ""

    for (let i = 0; i < digraphs.length; i++) {
      const [a, b] = digraphs[i]
      const [ar, ac] = findPos(grid, a)
      const [br, bc] = findPos(grid, b)
      let r1, c1, r2, c2

      if (ar === br) {
        // same row -> left
        r1 = ar; r2 = br
        c1 = (ac + 4) % 5; c2 = (bc + 4) % 5
      } else if (ac === bc) {
        // same column -> up
        c1 = ac; c2 = bc
        r1 = (ar + 4) % 5; r2 = (br + 4) % 5
      } else {
        r1 = ar; c1 = bc
        r2 = br; c2 = ac
      }

      const rchar1 = grid[r1][c1]
      const rchar2 = grid[r2][c2]
      out += rchar1 + rchar2

      steps.push({
        title: `Pair ${i + 1} — Playfair reverse`,
        plaintext: `${a}${b}`,
        key: "Grid-based",
        operation: `positions: ${a}(${ar},${ac}), ${b}(${br},${bc}) → reverse Playfair`,
        result: `${rchar1}${rchar2}`,
        explanation: "Reverse Playfair: same row → shift left, same column → shift up, rectangle → swap columns.",
      })
    }

    const formatted = formatPlayfairSteps({ text: out, out: text, key, steps, isEncrypt: false })
    return {
      output: out,
      steps: { ...formatted, summary: { plaintext: out, key, output: text }, matrix: grid },
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

export default playfairCipher
