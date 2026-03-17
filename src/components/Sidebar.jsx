import InfoCard from "./InfoCard"
import { Key, MessageSquareLock } from "lucide-react"
import useAppStore from "../store/useAppStore"

const Sidebar = () => {
  const senderData = useAppStore((s) => s.senderData)
  const receiverData = useAppStore((s) => s.receiverData)
  const setSenderData = useAppStore((s) => s.setSenderData)
  const setReceiverData = useAppStore((s) => s.setReceiverData)

  const handleClear = () => {
    setSenderData({ sessionKey: "", encryptedMessage: "", steps: [], info: "" })
    setReceiverData({ publicKey: "", privateKey: "", steps: [], info: "" })
  }

  return (
    <aside className="w-75 border-r dark:bg-neutral-950 relative">
      <div className="p-4 flex flex-col gap-6 overflow-y-auto scrollbar-thin h-full">

        {/* Sender Section */}
        <section>
          <div className="flex justify-center">
            <h2 className="mb-3 text-sm font-semibold border-b border-gray-500 w-fit px-2">
              Sender Data
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <InfoCard
              title="Session Key"
              description={
                "Symmetric encryption key"
              } 
              content={senderData.sessionKey || <Key/>}
            />
            <InfoCard
              title="Encrypted Message"
              description="Encrypted payload"
              content={senderData.encryptedMessage || <MessageSquareLock/>}
            />
          </div>
        </section>

        {/* Receiver Section */}
        <section>
          <div className="flex justify-center">
            <h2 className="my-4 text-sm font-semibold border-b border-gray-500 w-fit px-2">
              Receiver Data
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <InfoCard
              title="Public Key"
              description="Receiver public key"
              content={receiverData.publicKey || <Key/>}
            />
            <InfoCard
              title="Private Key"
              description="Receiver private key"
              content={receiverData.privateKey || <Key/>}
            />
          </div>
        </section>

      </div>
    </aside>
  )
}

export default Sidebar
