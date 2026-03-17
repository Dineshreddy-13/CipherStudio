import { useEffect, useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Info, ListOrdered } from "lucide-react"

// Small helper to render a monospace matrix
const Matrix = ({ matrix }) => {
  if (!Array.isArray(matrix)) return null
  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0]?.length || 0}, minmax(28px,1fr))` }}>
      {matrix.flat().map((cell, i) => (
        <div key={i} className="border rounded bg-muted/10 text-center font-mono p-1 text-sm">{cell}</div>
      ))}
    </div>
  )
}

const StepsView = ({ algorithm, steps = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  const isStructured = steps && !Array.isArray(steps) && typeof steps === "object"

  const stepsData = isStructured
    ? steps
    : {
        kind: "generic",
        title: algorithm?.name || "Algorithm",
        steps: Array.isArray(steps) ? steps : [],
      }

  const items = stepsData.steps || []
  const total = items.length

  useEffect(() => setActiveIndex(0), [stepsData.kind, total])

  const current = items[activeIndex]

  const goNext = () => setActiveIndex((i) => Math.min(total - 1, i + 1))
  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1))

  const headerTitle = algorithm?.name || stepsData.title || "Algorithm"

  // determine view type heuristically
  const viewKind = useMemo(() => stepsData.kind || "generic", [stepsData.kind])

  // Check if there are no steps to display
  const hasNoSteps = total === 0 || !steps || (isStructured && !stepsData.steps)

  return (
    <Card className="flex flex-col max-h-[60vh]">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CardTitle className="">{headerTitle}</CardTitle>
          {stepsData?.mode && !hasNoSteps && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/50 text-sky-200">{stepsData.mode}</span>
          )}
        </div>

        {!hasNoSteps && (
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={goPrev} disabled={activeIndex === 0}>← Prev</Button>
            <div className="text-sm text-muted-foreground">{total === 0 ? 0 : activeIndex + 1} / {total}</div>
            <Button size="sm" variant="ghost" onClick={goNext} disabled={activeIndex === total - 1}>Next →</Button>
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-y-auto scrollbar-thin text-sm space-y-4">
        {/* Placeholder when no encryption performed */}
        {hasNoSteps ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ListOrdered className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Encryption Performed</h3>
            <p className="text-center max-w-md">
              Enter your text and key, then click "Encrypt" or "Decrypt" to see the step-by-step process here.
            </p>
          </div>
        ) : (
          <>
            {/* Iteration-style view (xor, vigenere, caesar, aes, generic lists) */}
            {(viewKind === "xor" || viewKind === "vigenere" || viewKind === "caesar" || viewKind === "aes" || viewKind === "generic") && (
              <div className="space-y-3">
                <div className="rounded border p-3 bg-muted/5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold mb-2">{current?.title || items[activeIndex]?.title || `Step ${activeIndex + 1}`}</div>

                      <div className="space-y-2 text-[13px]">
                        {current?.plaintext && <div><div className="text-xs text-muted-foreground">Plaintext</div><div className="font-mono text-sky-500 wrap-break-word">{current.plaintext}</div></div>}
                        {current?.key && <div><div className="text-xs text-muted-foreground">Key</div><div className="font-mono text-violet-500 wrap-break-word">{current.key}</div></div>}
                        {current?.operation && <div><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500 wrap-break-word">{current.operation}</div></div>}
                        {current?.result && <div><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 wrap-break-word">{current.result}</div></div>}
                        {current?.explanation && <div className="text-muted-foreground flex items-start gap-2 border-l pl-3"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                      </div>
                    </div>

                    <div className="w-full sm:w-52">
                      <div className="rounded border p-2 bg-muted/10 text-xs">
                        <div className="font-semibold">Summary</div>
                        <div className="mt-2 font-mono text-[13px] wrap-break-word">{stepsData.summary?.output || current?.result || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* iteration thumbnails */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`min-w-22 px-3 py-2 rounded border ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}
                    >
                      <div className="text-xs font-semibold truncate">{it.title || `#${idx + 1}`}</div>
                      <div className="text-[11px] font-mono mt-1 truncate">{(it.result || it.operation || '').toString().slice(0, 24)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix view (for algorithms that provide matrix data) */}
            {viewKind === "playfair" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <div className="text-base font-semibold">{current.title || `Step ${activeIndex + 1}`}</div>

                    <div className="space-y-2 text-[13px] mt-2">
                      {current?.plaintext && <div><div className="text-xs text-muted-foreground">Plaintext</div><div className="font-mono text-sky-500 wrap-break-word">{current.plaintext}</div></div>}
                      {current?.key && <div><div className="text-xs text-muted-foreground">Key</div><div className="font-mono text-violet-500 wrap-break-word">{current.key}</div></div>}
                      {current?.operation && <div><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500 wrap-break-word">{current.operation}</div></div>}
                      {current?.result && <div><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 wrap-break-word">{current.result}</div></div>}

                      {current?.explanation && <div className="text-muted-foreground flex items-start gap-2 border-l pl-3 mt-2"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                    </div>
                  </div>

                  <div className="sm:col-span-1 space-y-3">
                    <div className="rounded border p-2 bg-muted/10 text-xs">
                      <div className="font-semibold">Matrix</div>
                      <div className="mt-2 overflow-auto">
                        <Matrix matrix={current.matrix || stepsData.matrix} />
                      </div>
                    </div>

                    <div className="rounded border p-2 bg-muted/10 text-xs">
                      <div className="font-semibold">Summary</div>
                      <div className="mt-2 font-mono text-[13px] wrap-break-word">{stepsData.summary?.output || current?.result || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button key={idx} onClick={() => setActiveIndex(idx)} className={`px-2 py-1 rounded border ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}>#{idx + 1}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Transposition view - matrix + step details */}
            {viewKind === "transposition" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <div className="text-base font-semibold">{current.title || `Step ${activeIndex + 1}`}</div>

                    <div className="space-y-2 text-[13px] mt-2">
                      {current?.plaintext && <div><div className="text-xs text-muted-foreground">Plaintext</div><div className="font-mono text-sky-500 wrap-break-word">{current.plaintext}</div></div>}
                      {current?.key && <div><div className="text-xs text-muted-foreground">Key</div><div className="font-mono text-violet-500 wrap-break-word">{current.key}</div></div>}
                      {current?.operation && <div><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500 wrap-break-word">{current.operation}</div></div>}
                      {current?.result && <div><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 wrap-break-word">{current.result}</div></div>}

                      {current?.explanation && <div className="text-muted-foreground flex items-start gap-2 border-l pl-3 mt-2"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                    </div>
                  </div>

                  <div className="sm:col-span-1 space-y-3">
                    {(current?.matrix || stepsData.matrix) && (
                      <div className="rounded border p-2 bg-muted/10 text-xs">
                        <div className="font-semibold">Matrix</div>
                        <div className="mt-2 overflow-auto">
                          <Matrix matrix={current.matrix || stepsData.matrix} />
                        </div>
                      </div>
                    )}

                    <div className="rounded border p-2 bg-muted/10 text-xs">
                      <div className="font-semibold">Summary</div>
                      <div className="mt-2 font-mono text-[13px] wrap-break-word">{stepsData.summary?.output || current?.result || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {items.map((it, idx) => (
                    <button key={idx} onClick={() => setActiveIndex(idx)} className={`px-2 py-1 rounded border ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}>#{idx + 1}</button>
                  ))}
                </div>
              </div>
            )}

            {/* RSA/complex view - keep a focused display with navigation */}
            {viewKind === "rsa" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3">
                  <div className="text-base font-semibold">{current.title || `Stage ${activeIndex + 1}`}</div>
                  {current.operation && <div className="mt-2"><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500">{current.operation}</div></div>}
                  {current.result && <div className="mt-2"><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 whitespace-pre-wrap">{current.result}</div></div>}
                  {current.explanation && <div className="mt-3 text-muted-foreground border-l pl-3"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                  {items.map((item, index) => (
                    <div key={index} className={`rounded border px-2 py-1 ${index === activeIndex ? "bg-muted/60 text-foreground" : "bg-muted/20"}`}>{index + 1}. {item.title}</div>
                  ))}
                </div>
              </div>
            )}

            {/* ElGamal view - per-chunk encryption/decryption */}
            {viewKind === "elgamal" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3">
                  <div className="text-base font-semibold">{stepsData.title}</div>
                  {current.operation && <div className="mt-2"><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500">{current.operation}</div></div>}
                  {current.result && <div className="mt-2"><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 whitespace-pre-wrap">{current.result}</div></div>}
                  {current.explanation && <div className="mt-3 text-muted-foreground border-l pl-3"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                  {items.map((item, index) => (
                    <div key={index} className={`rounded border px-2 py-1 ${index === activeIndex ? "bg-muted/60 text-foreground" : "bg-muted/20"}`}>{index + 1}. {item.title}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Diffie-Hellman view - key exchange display */}
            {viewKind === "diffie-hellman" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3 bg-muted/5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold mb-2">{current?.title || items[activeIndex]?.title || `Step ${activeIndex + 1}`}</div>

                      <div className="space-y-2 text-[13px]">
                        {current?.plaintext && <div><div className="text-xs text-muted-foreground">Plaintext</div><div className="font-mono text-sky-500 wrap-break-word">{current.plaintext}</div></div>}
                        {current?.key && <div><div className="text-xs text-muted-foreground">Key</div><div className="font-mono text-violet-500 wrap-break-word">{current.key}</div></div>}
                        {current?.operation && <div><div className="text-xs text-muted-foreground">Operation</div><div className="font-mono text-purple-500 wrap-break-word">{current.operation}</div></div>}
                        {current?.result && <div><div className="text-xs text-muted-foreground">Result</div><div className="font-mono text-emerald-500 wrap-break-word">{current.result}</div></div>}
                        {current?.explanation && <div className="text-muted-foreground flex items-start gap-2 border-l pl-3"><Info size={14} className="mt-0.5" /> <p>{current.explanation}</p></div>}
                      </div>
                    </div>

                    <div className="w-full sm:w-52">
                      <div className="rounded border p-2 bg-muted/10 text-xs">
                        <div className="font-semibold">Summary</div>
                        <div className="mt-2 font-mono text-[13px] wrap-break-word">{stepsData.summary?.output || current?.result || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* step thumbnails */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`min-w-22 px-3 py-2 rounded border ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}
                    >
                      <div className="text-xs font-semibold truncate">{it.title || `#${idx + 1}`}</div>
                      <div className="text-[11px] font-mono mt-1 truncate">{(it.result || it.operation || '').toString().slice(0, 24)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hill Cipher view - matrix-based encryption/decryption */}
            {viewKind === "hill" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3 bg-muted/5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold mb-2">{stepsData.title}</div>

                      <div className="space-y-3 text-[13px]">
                        {current?.plainChars && (
                          <div>
                            <div className="text-xs text-muted-foreground">Plaintext Block</div>
                            <div className="font-mono text-sky-500">{current.plainChars}</div>
                            <div className="text-xs text-muted-foreground mt-1">Values: {current.plainValues}</div>
                          </div>
                        )}
                        {current?.cipherChars && (
                          <div>
                            <div className="text-xs text-muted-foreground">Ciphertext Block</div>
                            <div className="font-mono text-blue-500">{current.cipherChars}</div>
                            <div className="text-xs text-muted-foreground mt-1">Values: {current.cipherValues}</div>
                          </div>
                        )}

                        {current?.keyMatrix && (
                          <div>
                            <div className="text-xs text-muted-foreground">Key Matrix</div>
                            <div className="mt-1">
                              <Matrix matrix={current.keyMatrix} />
                            </div>
                          </div>
                        )}

                        {current?.inverseMatrix && (
                          <div>
                            <div className="text-xs text-muted-foreground">Inverse Matrix</div>
                            <div className="mt-1">
                              <Matrix matrix={current.inverseMatrix} />
                            </div>
                          </div>
                        )}

                        {current?.result && (
                          <div>
                            <div className="text-xs text-muted-foreground">Result</div>
                            <div className="font-mono text-emerald-500">{current.result}</div>
                          </div>
                        )}
                        {current?.resultChars && (
                          <div className="text-xs text-muted-foreground">Result Characters: {current.resultChars}</div>
                        )}
                      </div>
                    </div>

                    <div className="w-full sm:w-52">
                      <div className="rounded border p-2 bg-muted/10 text-xs">
                        <div className="font-semibold">Summary</div>
                        <div className="mt-2 font-mono text-[13px] break-all">
                          {stepsData.summary?.output || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* block thumbnails */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`min-w-24 px-3 py-2 rounded border text-[11px] ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}
                    >
                      Block {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* DES view - rounds + key schedule */}
            {viewKind === "des" && current && (
              <div className="space-y-3">
                <div className="rounded border p-3 bg-muted/5">
                  <div className="text-base font-semibold mb-2">{stepsData.title || 'DES Process'}</div>

                  <div className="space-y-3 text-[13px]">
                    {stepsData.keySchedule && (
                      <div>
                        <div className="text-xs text-muted-foreground">Key Schedule</div>
                        <div className="grid grid-cols-4 gap-2 mt-2 text-[12px]">
                          {stepsData.keySchedule.map(k => (
                            <div key={k.round} className="rounded border px-2 py-1 bg-muted/10">R{k.round}: {k.subkey}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-muted-foreground">Round Details</div>
                      <div className="rounded border p-2 bg-muted/10 mt-2">
                        <div className="font-mono text-[13px]">{current?.result}</div>
                        {current?.operation && <div className="text-xs text-muted-foreground mt-2">{current.operation}</div>}
                        {current?.explanation && <div className="text-muted-foreground mt-2">{current.explanation}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button key={idx} onClick={() => setActiveIndex(idx)} className={`min-w-24 px-3 py-2 rounded border text-[11px] ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}>
                      {it.title || `Round ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rail Fence Cipher view - fence pattern visualization */}
            {viewKind === "rail-fence" && (
              <div className="space-y-3">
                <div className="rounded border p-3 bg-muted/5">
                  <div className="text-base font-semibold mb-3">{stepsData.title}</div>

                  <div className="space-y-3 text-[13px]">
                    {stepsData.summary?.plaintext && (
                      <div>
                        <div className="text-xs text-muted-foreground">Plaintext</div>
                        <div className="font-mono text-sky-500">{stepsData.summary.plaintext}</div>
                      </div>
                    )}

                    {stepsData.summary?.key && (
                      <div>
                        <div className="text-xs text-muted-foreground">Number of Rails</div>
                        <div className="font-mono text-violet-500">{stepsData.summary.key}</div>
                      </div>
                    )}

                    {stepsData.fence && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Zigzag Fence Pattern (Encryption)</div>
                        <div className="border rounded p-2 bg-muted/10 font-mono text-[11px] space-y-1">
                          {stepsData.fence.map((rail, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">R{idx}:</span>
                              <span className="text-emerald-500">{rail.join(' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stepsData.summary?.output && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {stepsData.mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
                        </div>
                        <div className="font-mono text-emerald-500 break-all">{stepsData.summary.output}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rail buttons for navigation */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`min-w-20 px-3 py-2 rounded border text-[11px] ${idx === activeIndex ? 'bg-sky-500 text-white' : 'bg-muted/10'}`}
                    >
                      Rail {it.railNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StepsView