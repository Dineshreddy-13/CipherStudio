import { FileEncryption } from "./FileEncryption"
import { FileDecryption } from "./FileDecryption"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const FileSection = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="encrypt" className="w-full">
        <TabsList className="px-8 border-b">
          <TabsTrigger value="encrypt">Encrypt File</TabsTrigger>
          <TabsTrigger value="decrypt">Decrypt File</TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="p-8">
          <FileEncryption />
        </TabsContent>

        <TabsContent value="decrypt" className="p-8">
          <FileDecryption />
        </TabsContent>
      </Tabs>
    </div>
  )
}
