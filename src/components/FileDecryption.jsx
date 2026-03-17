import { useState } from "react"
import  useAppStore  from "@/store/useAppStore"
import { algorithms } from "@/algorithms"
import { decryptFile, downloadFile, formatFileSize } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const FileDecryption = () => {
  const {
    algorithm,
    setAlgorithm,
    senderSymKey,
    setSenderSymKey,
    receiverKeyInput,
    setReceiverKeyInput,
    receiverData,
    setReceiverData,
  } = useAppStore()

  const [selectedFile, setSelectedFile] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast.success(`File selected: ${file.name} (${formatFileSize(file.size)})`)
    }
  }

  const handleAlgorithmSelect = (algorithmId) => {
    const selectedAlgorithm = algorithms.find((alg) => alg.id === algorithmId)
    if (selectedAlgorithm) {
      setAlgorithm(selectedAlgorithm)
    }
  }

  const handleDecryptFile = async () => {
    if (!selectedFile) {
      toast.error("Please select an encrypted file")
      return
    }

    if (!algorithm) {
      toast.error("Please select the decryption algorithm")
      return
    }

    try {
      setIsDecrypting(true)

      let key = null

      if (algorithm.type === "symmetric") {
        key = senderSymKey
        if (!key) {
          toast.error("Please enter the symmetric key")
          return
        }
      } else {
        key = receiverKeyInput
        if (!key) {
          toast.error("Please enter the private key")
          return
        }
      }

      const result = await decryptFile(selectedFile, key, algorithm)

      setReceiverData({
        plaintext: result.decryptedContent,
        steps: result.steps,
      })

      // Download the decrypted file
      downloadFile(result.decryptedContent, result.filename, "text/plain")

      toast.success(`File decrypted successfully! Saved as: ${result.filename}`)
    } catch (error) {
      const errorMessage = error.message || "File decryption failed"
      toast.error(errorMessage)
      console.error("File decryption error:", error)
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">File Selection</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="encrypted-file-input">Select Encrypted File</Label>
              <Input
                id="encrypted-file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={isDecrypting}
                className="mt-2"
              />
              {selectedFile && <p className="text-sm text-gray-500 mt-2">✓ {selectedFile.name}</p>}
            </div>
          </div>
        </Card>

        {/* Algorithm & Key Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Decryption Settings</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="decrypt-algorithm-select">Algorithm</Label>
              <Select value={algorithm?.id || ""} onValueChange={handleAlgorithmSelect}>
                <SelectTrigger id="decrypt-algorithm-select" className="mt-2">
                  <SelectValue placeholder="Select an algorithm" />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map((alg) => (
                    <SelectItem key={alg.id} value={alg.id}>
                      {alg.name} ({alg.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Symmetric Key Input */}
            {algorithm?.type === "symmetric" && (
              <div>
                <Label htmlFor="decrypt-sym-key-input">Decryption Key</Label>
                <Input
                  id="decrypt-sym-key-input"
                  type="password"
                  placeholder="Enter the same key used for encryption"
                  value={senderSymKey}
                  onChange={(e) => setSenderSymKey(e.target.value)}
                  disabled={isDecrypting}
                  className="mt-2"
                />
              </div>
            )}

            {/* Asymmetric Private Key Input */}
            {algorithm?.type === "asymmetric" && (
              <div>
                <Label htmlFor="private-key-input">Private Key</Label>
                <textarea
                  id="private-key-input"
                  placeholder={
                    algorithm.id === "rsa"
                      ? "Paste RSA private key (PEM format)"
                      : "Paste JSON private key"
                  }
                  value={receiverKeyInput}
                  onChange={(e) => setReceiverKeyInput(e.target.value)}
                  disabled={isDecrypting}
                  className="w-full h-24 p-2 border rounded mt-2 font-mono text-xs"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Decryption Result */}
      {receiverData.plaintext && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Decrypted Output</h3>
          <p className="text-sm text-gray-600 mb-3">
            Decrypted file preview (first 500 chars):
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono text-xs max-h-40 overflow-auto whitespace-pre-wrap wrap-break-word">
            {receiverData.plaintext.substring(0, 500)}
            {receiverData.plaintext.length > 500 && "..."}
          </div>
        </Card>
      )}

      {/* Decryption Button */}
      <Button
        onClick={handleDecryptFile}
        disabled={!selectedFile || !algorithm || isDecrypting}
        size="lg"
        className="w-full"
      >
        {isDecrypting ? "Decrypting..." : "Decrypt File"}
      </Button>
    </div>
  )
}
