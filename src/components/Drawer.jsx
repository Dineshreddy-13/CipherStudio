import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"

const DrawerDemo = ({ algorithm, mode = "encrypt" }) => {
  return (
    <Drawer modal={false}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Flowchart</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full h-[60vh] p-4 flex items-center justify-center text-muted-foreground">
          {/* Coming soon...
           */}
           {/* <img src="./monkey.jpg"  alt="" width={400} height={400} className="rounded-full" /> */}
           <h1 className="text-9xl text-sky-500 font-bold">Akshitha</h1>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default DrawerDemo;