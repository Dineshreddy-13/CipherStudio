import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"

import { Label } from "./ui/label"
import AlgorithmSelector from "./AlgorithmSelector"
import { LockKeyhole, Logs, File } from "lucide-react"
import DrawerDemo from "./Drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import rsaCipher from "@/algorithms/rsa"
import diffieHellmanCipher from "@/algorithms/diffie-hellman"
import hillCipher from "@/algorithms/hill"
import elgamalCipher from "@/algorithms/elgamal"
// import useAppStore from "../store/useAppStore"
import useAppStore from "@/store/useAppStore"
import { toast } from "sonner"
import {
    generateDeterministicKeyMatrix,
    validateAndParseKey,
    importRSAPublicKey,
    encryptWithJSONKey,
    encryptWithCryptoKey,
    encryptSymmetric,
    getUserFriendlyErrorMessage,
    formatErrorMessage,
    encryptFile,
    downloadFile,
    formatFileSize,
} from "@/lib/utils"


const InputSection = () => {
    const algorithm = useAppStore((s) => s.algorithm)
    const setAlgorithm = useAppStore((s) => s.setAlgorithm)
    const setSenderData = useAppStore((s) => s.setSenderData)
    const setReceiverData = useAppStore((s) => s.setReceiverData)

    // Persistent store state
    const text = useAppStore((s) => s.senderText)
    const setText = useAppStore((s) => s.setSenderText)
    const symKey = useAppStore((s) => s.senderSymKey)
    const setSymKey = useAppStore((s) => s.setSenderSymKey)
    const publicKeyInput = useAppStore((s) => s.senderPublicKeyInput)
    const setPublicKeyInput = useAppStore((s) => s.setSenderPublicKeyInput)

    const setKeyInput = useAppStore((s) => s.setReceiverKeyInput)

    const [generatedKeys, setGeneratedKeys] = useState({
        publicKey: null,
        privateKey: null,
    })
    const [protectKey, setProtectKey] = useState(false)

    const [rsaKeys, setRsaKeys] = useState({
        publicKey: null,
        privateKey: null,
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const enablePublicKeyInput =
        algorithm?.type === "asymmetric" ||
        (algorithm?.type === "symmetric" && protectKey)

    const handleAlgorithmSelect = async (algo) => {
        setAlgorithm(algo)

        if (algo?.type === "asymmetric") {
            try {
                const { publicKey, privateKey } = await algo.generateKeys()
                toast.success("public and private keys generated.", { position: "top-right" })

                // RSA uses Web Crypto CryptoKey objects; export them to Base64/PEM
                if (algo.id === "rsa") {
                    const exportedPublicBase64 = await exportKey(publicKey, "public")
                    const exportedPrivateBase64 = await exportKey(privateKey, "private")

                    const toPem = (base64, label) => {
                        const clean = base64.replace(/\s+/g, "")
                        const lines = clean.match(/.{1,64}/g) || [clean]
                        return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`
                    }

                    const exportedPublic = toPem(exportedPublicBase64, "PUBLIC KEY")
                    const exportedPrivate = toPem(exportedPrivateBase64, "PRIVATE KEY")

                    setGeneratedKeys({ publicKey, privateKey })
                    setReceiverData({
                        publicKey: exportedPublic,
                        privateKey: exportedPrivate,
                    })

                    // Pre-fill sender/receiver inputs with the generated PEM keys
                    setPublicKeyInput(exportedPublic)
                    setKeyInput(exportedPrivate)
                } else {
                    // Diffie-Hellman / ElGamal use JSON serializable keys
                    const exportedPublic = btoa(JSON.stringify(publicKey))
                    const exportedPrivate = btoa(JSON.stringify(privateKey))

                    setGeneratedKeys({ publicKey, privateKey })
                    setReceiverData({
                        publicKey: exportedPublic,
                        privateKey: exportedPrivate,
                    })

                    // Pre-fill sender/receiver inputs with the generated keys
                    setPublicKeyInput(exportedPublic)
                    setKeyInput(exportedPrivate)
                }
            } catch (err) {
                toast.error("Key generation failed.", { position: "top-right" })
                console.error(err)
            }
        } else {
            setGeneratedKeys({ publicKey: null, privateKey: null })
        }
    }

    async function exportKey(key, type) {
        const format = type === "public" ? "spki" : "pkcs8"
        const exported = await crypto.subtle.exportKey(format, key)
        return btoa(String.fromCharCode(...new Uint8Array(exported)))
    }

    const handleEncrypt = async () => {
        if (!algorithm) {
            toast.error("Algorithm is required.", { position: "top-right" })
            return
        }

        // Check if file encryption
        if (selectedFile) {
            if (!selectedFile) {
                toast.error("Please select a file.", { position: "top-right" })
                return
            }

            try {
                setIsLoading(true)

                let key = null
                if (algorithm.type === "symmetric") {
                    key = symKey
                    if (!key) {
                        toast.error("Key is required for symmetric encryption.", { position: "top-right" })
                        return
                    }
                } else {
                    key = publicKeyInput || algorithm.params?.publicKey
                    if (!key) {
                        toast.error("Public key required.", { position: "top-right" })
                        return
                    }
                }

                const result = await encryptFile(selectedFile, key, algorithm)

                let sessionKeyValue = ""
                if (algorithm.type === "symmetric") {
                    sessionKeyValue = symKey
                    if (protectKey) {
                        const encryptedKeyResult = await rsaCipher.encrypt(symKey, rsaKeys.publicKey)
                        sessionKeyValue = encryptedKeyResult.output
                    }
                } else {
                    sessionKeyValue = publicKeyInput
                }

                setSenderData({
                    encryptedMessage: result.encryptedContent,
                    sessionKey: sessionKeyValue,
                    steps: result.steps,
                    info: { filename: selectedFile.name, originalSize: result.originalSize },
                })
                downloadFile(result.encryptedContent, result.filename, "text/plain")
                toast.success(`File encrypted! Original: ${formatFileSize(result.originalSize)} → Encrypted: ${formatFileSize(result.encryptedSize)}`, { position: "top-right" })
            } catch (error) {
                const errorMsg = getUserFriendlyErrorMessage(error, "File encryption failed")
                toast.error(errorMsg, { position: "top-right" })
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        // Text encryption
        else {
            if (!text) {
                toast.error("Plaintext is required.", { position: "top-right" })
                return
            }

            try {
                setIsLoading(true)
                let result

                // 🔐 SYMMETRIC ENCRYPTION
                if (algorithm.type === "symmetric") {
                    if (!symKey) {
                        toast.error("Key is required for symmetric encryption.", { position: "top-right" })
                        return
                    }

                    result = await encryptSymmetric(text, symKey, algorithm)

                    let sessionKeyValue = symKey
                    if (protectKey) {
                        const encryptedKeyResult = await rsaCipher.encrypt(symKey, rsaKeys.publicKey)
                        sessionKeyValue = encryptedKeyResult.output
                    }

                    setSenderData({
                        encryptedMessage: result.output,
                        sessionKey: sessionKeyValue,
                        steps: result.steps,
                        info: result.info || null,
                    })
                }
                // 🔑 ASYMMETRIC ENCRYPTION
                else if (algorithm.type === "asymmetric") {
                    if (!publicKeyInput) {
                        toast.error("Public key required.", { position: "top-right" })
                        return
                    }

                    // Handle JSON-based asymmetric algorithms (DH, ElGamal)
                    if (["diffie-hellman", "elgamal"].includes(algorithm.id)) {
                        const publicKeyData = validateAndParseKey(publicKeyInput, algorithm.id)
                        result = await encryptWithJSONKey(text, publicKeyData, algorithm)

                        setSenderData({
                            encryptedMessage: result.output,
                            sessionKey: publicKeyInput,
                            steps: result.steps,
                            info: result.info,
                        })
                    }
                    // Handle CryptoKey-based algorithms (RSA)
                    else {
                        const importedKey = await importPublicKey(publicKeyInput)
                        result = await encryptWithCryptoKey(text, importedKey, algorithm)

                        setSenderData({
                            encryptedMessage: result.output,
                            sessionKey: publicKeyInput,
                            steps: result.steps,
                            info: result.info,
                        })
                    }
                }

                toast.success("Encryption successful.", { position: "top-right" })
            } catch (err) {
                const errorMsg = getUserFriendlyErrorMessage(err, "Encryption failed")
                toast.error(errorMsg, { position: "top-right" })
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
    }




    const importPublicKey = importRSAPublicKey

    useEffect(() => {
        if (
            algorithm?.type === "symmetric" &&
            !protectKey
        ) {
            setPublicKeyInput("")
        }
    }, [algorithm, protectKey])



    return (
        <div>
            <div className="grid grid-cols-2 grid-rows-2 gap-3 px-8 mt-4">
                {/* (0,0) Grouped Combobox */}
                <div className="flex items-center justify-start">
                    <AlgorithmSelector onSelect={handleAlgorithmSelect} />

                </div>

                {/* (0,1) Password with show/hide */}
                <div className="relative flex items-center justify-start">
                    <div className="w-full">
                        <Label className="mb-2">Symmetric Key</Label>
                        <Input
                            placeholder="Password"
                            value={symKey}
                            onChange={(e) => setSymKey(e.target.value)}
                            disabled={algorithm?.type !== "symmetric"}
                        />
                        <Label className="mt-1 mb-4 text-xs text-gray-700">
                            Enabled only for symmetric algorithms.
                        </Label>
                    </div>
                </div>

                {/* (1,0) Small Card */}
                <div className="max-w-[85%] ">
                    <Item variant="outline">
                        <ItemContent>
                            <ItemTitle>Protect Key</ItemTitle>
                            <ItemDescription className="text-xs">
                                Encrypt symmetric using public key
                            </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Switch
                                checked={protectKey}
                                onCheckedChange={async (checked) => {
                                    setProtectKey(checked)

                                    if (checked && algorithm?.type === "symmetric") {
                                        const { publicKey, privateKey } = await rsaCipher.generateKeys()
                                        toast.success("public and private keys generated.", { position: "top-right" })
                                        setRsaKeys({ publicKey, privateKey })
                                        setReceiverData({
                                            publicKey: await exportKey(publicKey, "public"),
                                            privateKey: await exportKey(privateKey, "private"),
                                        })
                                    }

                                    if (!checked) {
                                        setRsaKeys({ publicKey: null, privateKey: null })
                                        setReceiverData({ publicKey: "", privateKey: "" })
                                    }
                                }}
                                disabled={algorithm?.type !== "symmetric"}
                                className="data-[state=checked]:bg-sky-400"
                            />

                        </ItemActions>
                    </Item>
                </div>

                {/* (1,1) Text + Switch + Password */}
                <div className="flex items-center justify-start gap-3">
                    <div className="w-full">
                        <div>
                            <Label className="mb-2">public key</Label>
                            <Input
                                type="password"
                                placeholder={
                                    algorithm?.id === "rsa"
                                        ? "Paste RSA public key (PEM or Base64)"
                                        : "Paste public key (JSON or Base64)"
                                }
                                value={publicKeyInput}
                                onChange={(e) => setPublicKeyInput(e.target.value)}

                                disabled={!enablePublicKeyInput}
                                className={!enablePublicKeyInput ? "opacity-50 cursor-not-allowed" : ""}


                            />
                            <Label className="mt-1 mb-2 text-xs text-gray-700">
                                Only enabled for asymmetric algorithms.
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 py-4">
                <Tabs defaultValue="text" className="h-[30vh]">
                    <TabsList>
                        <TabsTrigger value="text">
                            <Logs />
                            Text</TabsTrigger>
                        <TabsTrigger value="file">
                            <File />
                            File</TabsTrigger>
                    </TabsList>

                    {/* Text Tab */}
                    <TabsContent value="text" className="h-full mt-4">
                        <Textarea
                            placeholder="Enter the text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="h-full resize-none"
                        />
                    </TabsContent>

                    {/* File Tab */}
                    <TabsContent value="file" className="h-full mt-4">
                        <div className="h-full flex flex-col">
                            <label
                                htmlFor="file-input-sender"
                                className="relative h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            >
                                <input
                                    id="file-input-sender"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setSelectedFile(file)
                                            toast.success(`File selected: ${file.name} (${formatFileSize(file.size)})`)
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                                {selectedFile ? (
                                    <div className="text-center">
                                        <div className="flex items-center gap-2">
                                            <File className="w-10 h-10 text-green-500" />
                                            <div className="">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setSelectedFile(null)
                                            }}
                                            className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">Click or drag file here</p>
                                        <p className="text-xs text-gray-500 mt-1">Any file type supported</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-center mt-5 py-5">
                    <Button className="bg-green-600" onClick={handleEncrypt} disabled={isLoading}>
                        <LockKeyhole />
                        {isLoading ? "Encrypting..." : "Encrypt"}
                    </Button>
                </div>

                <DrawerDemo algorithm={algorithm} mode="encrypt" />

            </div>


        </div>
    );
}

export default InputSection;