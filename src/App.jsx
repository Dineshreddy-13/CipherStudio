import OutputSection from "./components/OutputSection"
import Sidebar from "./components/Sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InputSection from "./components/InputSection"
import ReceiverInputSection from "./components/ReceiverInputSection"
import useAppStore from "./store/useAppStore"
import { Toaster } from "./components/ui/sonner"
import SettingsMenu from "./components/SettingsMenu"
import { useEffect } from "react"

function App() {
  const algorithm = useAppStore((s) => s.algorithm)
  const senderData = useAppStore((s) => s.senderData)
  const receiverData = useAppStore((s) => s.receiverData)
  const theme = useAppStore((s) => s.theme)

  // Initialize theme on mount
  useEffect(() => {
    const htmlElement = document.documentElement
    if (theme === "dark") {
      htmlElement.classList.add("dark")
    } else {
      htmlElement.classList.remove("dark")
    }
  }, [theme])

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Tabs defaultValue="sender">
          <TabsList variant="line" className="w-full px-8">
              <div className="">
              <TabsTrigger value="sender">Sender</TabsTrigger>
              <TabsTrigger value="receiver">Receiver</TabsTrigger>
              </div>
              {/* <Button variant="ghost" className="ml-auto"><Ellipsis/></Button> */}
              <SettingsMenu/>
          </TabsList>

          <TabsContent value="sender" className="h-full">
            <InputSection />
            <OutputSection algorithm={algorithm} steps={senderData.steps} mode="encrypt" />
          </TabsContent>

          <TabsContent value="receiver" className="h-full mt-4">
            <ReceiverInputSection />
            <OutputSection algorithm={algorithm} steps={receiverData.steps} mode="decrypt" />
          </TabsContent>
        </Tabs>
      </main>
        <Toaster />
    </div>
  )
}

export default App
