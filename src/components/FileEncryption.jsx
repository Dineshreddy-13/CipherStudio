import { useState } from "react"
// import  useAppStore  from "@/store/useAppStore"
import useAppStore from "@/store/useAppStore"

import { algorithms } from "@/algorithms"
import { encryptFile, downloadFile, formatFileSize } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const FileEncryption = () => {
  const {
    algorithm,
    setAlgorithm,
    senderSymKey,
    setSenderSymKey,
    senderPublicKeyInput,
    setSenderPublicKeyInput,
    senderData,
    setSenderData,
  } = useAppStore()

  const [selectedFile, setSelectedFile] = useState(null)
  const [isEncrypting, setIsEncrypting] = useState(false)

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

  const handleEncryptFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first")
      return
    }

    if (!algorithm) {
      toast.error("Please select an encryption algorithm")
      return
    }

    try {
      setIsEncrypting(true)

      let key = null

      if (algorithm.type === "symmetric") {
        key = senderSymKey
        if (!key) {
          toast.error("Please enter a symmetric key")
          return
        }
      } else {
        key =
          algorithm.id === "rsa"
            ? senderPublicKeyInput
            : senderPublicKeyInput || algorithm.params?.publicKey

        if (!key) {
          toast.error("Please enter or generate a public key")
          return
        }
      }

      const result = await encryptFile(selectedFile, key, algorithm)

      setSenderData({
        output: result.encryptedContent,
        steps: result.steps,
      })

      // Download the encrypted file
      downloadFile(result.encryptedContent, result.filename, "text/plain")

      toast.success(`File encrypted successfully! Original: ${formatFileSize(result.originalSize)} → Encrypted: ${formatFileSize(result.encryptedSize)}`)
    } catch (error) {
      const errorMessage = error.message || "File encryption failed"
      toast.error(errorMessage)
      console.error("File encryption error:", error)
    } finally {
      setIsEncrypting(false)
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
              <Label htmlFor="file-input">Select File to Encrypt</Label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={isEncrypting}
                className="mt-2"
              />
              {selectedFile && <p className="text-sm text-gray-500 mt-2">✓ {selectedFile.name}</p>}
            </div>
          </div>
        </Card>

        {/* Algorithm & Key Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Encryption Settings</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="algorithm-select">Algorithm</Label>
              <Select value={algorithm?.id || ""} onValueChange={handleAlgorithmSelect}>
                <SelectTrigger id="algorithm-select" className="mt-2">
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
                <Label htmlFor="sym-key-input">Encryption Key</Label>
                <Input
                  id="sym-key-input"
                  type="password"
                  placeholder="Enter encryption key"
                  value={senderSymKey}
                  onChange={(e) => setSenderSymKey(e.target.value)}
                  disabled={isEncrypting}
                  className="mt-2"
                />
              </div>
            )}

            {/* Asymmetric Public Key Input */}
            {algorithm?.type === "asymmetric" && (
              <div>
                <Label htmlFor="public-key-input">Public Key</Label>
                <textarea
                  id="public-key-input"
                  placeholder={
                    algorithm.id === "rsa"
                      ? "Paste RSA public key (PEM or Base64)"
                      : "Paste public key (JSON or Base64)"
                  }
                  value={senderPublicKeyInput}
                  onChange={(e) => setSenderPublicKeyInput(e.target.value)}
                  disabled={isEncrypting}
                  className="w-full h-24 p-2 border rounded mt-2 font-mono text-xs"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Encryption Result */}
      {senderData.output && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Encrypted Output</h3>
          <p className="text-sm text-gray-600 mb-3">
            Encrypted file has been downloaded. Preview (first 200 chars):
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono text-xs max-h-40 overflow-auto">
            {senderData.output.substring(0, 200)}...
          </div>
        </Card>
      )}

      {/* Encryption Button */}
      <Button
        onClick={handleEncryptFile}
        disabled={!selectedFile || !algorithm || isEncrypting}
        size="lg"
        className="w-full"
      >
        {isEncrypting ? "Encrypting..." : "Encrypt File"}
      </Button>
    </div>
  )
}
