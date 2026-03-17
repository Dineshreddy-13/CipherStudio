import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemTitle } from "@/components/ui/item"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LockKeyholeOpen, Logs, File, KeyRound, MessageCircleMore } from "lucide-react"
import DrawerDemo from "./Drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "./ui/separator"
import { useState } from "react"
import rsaCipher from "@/algorithms/rsa"
import diffieHellmanCipher from "@/algorithms/diffie-hellman"
import elgamalCipher from "@/algorithms/elgamal"
import hillCipher from "@/algorithms/hill"
import useAppStore from "../store/useAppStore"
import { toast } from "sonner"
import {
    generateDeterministicKeyMatrix,
    validateAndParseKey,
    validatePrivateKey,
    importRSAPrivateKey,
    decryptWithJSONKey,
    decryptWithCryptoKey,
    decryptSymmetric,
    getUserFriendlyErrorMessage,
    decryptFile,
    downloadFile,
    formatFileSize,
} from "@/lib/utils"

const ReceiverInputSection = () => {
    const algorithm = useAppStore((s) => s.algorithm)
    const setReceiverData = useAppStore((s) => s.setReceiverData)

    // Persistent store state
    const keyInput = useAppStore((s) => s.receiverKeyInput)
    const setKeyInput = useAppStore((s) => s.setReceiverKeyInput)
    const encryptedText = useAppStore((s) => s.receiverEncryptedText)
    const setEncryptedText = useAppStore((s) => s.setReceiverEncryptedText)

    const [decryptedMessage, setDecryptedMessage] = useState("")
    const [selectedFileForDecrypt, setSelectedFileForDecrypt] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Hybrid recovery
    const [encryptedKey, setEncryptedKey] = useState("")
    const [recoveredKey, setRecoveredKey] = useState("")
    const [privateKeyInput, setPrivateKeyInput] = useState("")

    /* -------------------- HYBRID KEY RECOVERY -------------------- */

    const importPrivateKey = importRSAPrivateKey

    const handleRecoverKey = async () => {
        if (!encryptedKey || !privateKeyInput) return

        try {
            const privateKey = await importPrivateKey(privateKeyInput)

            const { output, steps, info } = await rsaCipher.decrypt(
                encryptedKey,
                privateKey
            )
            toast.success("Key recovery sucessfull.", { position: "top-right" })

            setRecoveredKey(output)
            setKeyInput(output) // 🔥 AUTO-FILL

            setReceiverData({
                steps: steps,
                info: info,
            })
        } catch (err) {
            toast.error("Key recovery failed.", { position: "top-right" })
            console.error(err)
            setRecoveredKey("❌ Key recovery failed")

        }
    }

    /* -------------------- DECRYPTION -------------------- */

    const handleDecrypt = async () => {
        if (!algorithm || !keyInput) {
            toast.error("Algorithm and key are required.", { position: "top-right" })
            return
        }

        // Check if file decryption
        if (selectedFileForDecrypt) {
            try {
                setIsLoading(true)

                const result = await decryptFile(selectedFileForDecrypt, keyInput, algorithm)
                setDecryptedMessage(result.decryptedContent)
                setReceiverData({
                    plaintext: result.decryptedContent,
                    steps: result.steps,
                })
                downloadFile(result.decryptedContent, result.filename, "text/plain")
                toast.success(`File decrypted successfully! Saved as: ${result.filename}`, { position: "top-right" })
            } catch (error) {
                const errorMsg = getUserFriendlyErrorMessage(error, "File decryption failed")
                toast.error(errorMsg, { position: "top-right" })
                console.error(error)
                setDecryptedMessage("❌ Decryption failed")
            } finally {
                setIsLoading(false)
            }
        }
        // Text decryption
        else {
            if (!encryptedText) {
                toast.error("Ciphertext is required.", { position: "top-right" })
                return
            }

            try {
                setIsLoading(true)
                let result

                // 🔐 SYMMETRIC DECRYPTION
                if (algorithm.type === "symmetric") {
                    result = await decryptSymmetric(encryptedText, keyInput, algorithm)
                }
                // 🔑 ASYMMETRIC DECRYPTION
                else if (algorithm.type === "asymmetric") {
                    // Handle JSON-based asymmetric algorithms (DH, ElGamal)
                    if (["diffie-hellman", "elgamal"].includes(algorithm.id)) {
                        const privateKeyData = validateAndParseKey(keyInput, algorithm.id)
                        validatePrivateKey(privateKeyData, algorithm.id)
                        result = await decryptWithJSONKey(encryptedText, privateKeyData, algorithm)
                    }
                    // Handle CryptoKey-based algorithms (RSA)
                    else {
                        const importedKey = await importPrivateKey(keyInput)
                        result = await decryptWithCryptoKey(encryptedText, importedKey, algorithm)
                    }
                }

                setDecryptedMessage(result.plaintext || result.output)
                setReceiverData({
                    steps: result.steps,
                    info: result.info,
                })
                toast.success("Decryption successful.", { position: "top-right" })
            } catch (err) {
                const errorMsg = getUserFriendlyErrorMessage(err, "Decryption failed")
                console.error(err)
                setDecryptedMessage("❌ Decryption failed")
                toast.error(errorMsg, { position: "top-right" })
            } finally {
                setIsLoading(false)
            }
        }
    }

    /* -------------------- UI -------------------- */

    return (
        <div className="px-8 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 mb-8 gap-3">
                <div className="flex items-end">

                    <Item variant="outline" className="dark:bg-neutral-900 h-7/10 w-9/10">
                        <ItemContent>
                            <ItemTitle>Decrypted Message</ItemTitle>
                            <Separator />
                            <div className="flex items-center justify-center h-35 overflow-y-auto scrollbar-thin break-all">
                                <p className="font-bold whitespace-pre-wrap text-green-500">
                                    {decryptedMessage || <MessageCircleMore />}
                                </p>
                            </div>
                        </ItemContent>
                    </Item>
                </div>

                {/* Hybrid Key Recovery */}
                <Item variant="outline">
                    <Field>
                        <FieldLabel>Encrypted Key</FieldLabel>
                        <Input
                            type="password"
                            placeholder="Paste encrypted session key"
                            value={encryptedKey}
                            onChange={(e) => setEncryptedKey(e.target.value)}
                            disabled={algorithm?.type !== "symmetric"}
                        />
                        <FieldDescription className="text-xs text-gray-600">
                            Used only for hybrid encryption
                        </FieldDescription>
                    </Field>

                    <Field className="">
                        <FieldLabel>Private Key</FieldLabel>
                        <Input
                            type="password"
                            placeholder="Paste RSA private key (PEM or Base64)"
                            value={privateKeyInput}
                            onChange={(e) => setPrivateKeyInput(e.target.value)}
                            disabled={algorithm?.type !== "symmetric"}
                        />
                    </Field>

                    <Button
                        className="mt-3"
                        onClick={handleRecoverKey}
                        disabled={algorithm?.type !== "symmetric"}
                    >
                        <KeyRound />
                        Recover Key
                    </Button>
                </Item>
            </div>

            {/* Key Input */}
            <div className="mb-5">
                <Field>
                    <FieldLabel>
                        {algorithm?.type === "asymmetric" ? "Private Key" : "Key"}
                    </FieldLabel>
                    <Input
                        type="password"
                        placeholder="Enter the key"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                    />
                </Field>
            </div>

            {/* Encrypted Text */}
            <div className="py-4">
                <Tabs defaultValue="text" className="h-[25vh]">
                    <TabsList>
                        <TabsTrigger value="text">
                            <Logs /> Text
                        </TabsTrigger>
                        <TabsTrigger value="file">
                            <File /> File
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="h-full mt-4">
                        <Textarea
                            placeholder="Paste encrypted text here"
                            value={encryptedText}
                            onChange={(e) => setEncryptedText(e.target.value)}
                            className="h-full resize-none"
                        />
                    </TabsContent>

                    <TabsContent value="file" className="h-full mt-4">
                        <div className="h-full flex flex-col">
                            <label
                                htmlFor="file-input-receiver"
                                className="relative h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            >
                                <input
                                    id="file-input-receiver"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setSelectedFileForDecrypt(file)
                                            toast.success(`File selected: ${file.name} (${formatFileSize(file.size)})`)
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                                {selectedFileForDecrypt ? (
                                    <div className="text-center">
                                        {/* <File className="w-12 h-12 text-sky-500 mx-auto mb-2" />
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedFileForDecrypt.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{formatFileSize(selectedFileForDecrypt.size)}</p> */}
                                        <div className="flex items-center gap-2">
                                            <File className="w-10 h-10 text-green-500" />
                                            <div className="">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {selectedFileForDecrypt.name}                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatFileSize(selectedFileForDecrypt.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setSelectedFileForDecrypt(null)
                                            }}
                                            className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">Click or drag file here</p>
                                        <p className="text-xs text-gray-500 mt-1">Select encrypted file to decrypt</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-center mt-5 py-5">
                    <Button className="bg-green-600" onClick={handleDecrypt} disabled={isLoading}>
                        <LockKeyholeOpen />
                        {isLoading ? "Decrypting..." : "Decrypt"}
                    </Button>
                </div>

                <DrawerDemo algorithm={algorithm} mode="decrypt" />
            </div>
        </div>
    )
}

export default ReceiverInputSection
