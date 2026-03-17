import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Ellipsis } from "lucide-react";
import { Button } from "./ui/button";
import useAppStore from "@/store/useAppStore"
import { toast } from "sonner"

const SettingsMenu = () => {
    const [showClearDialog, setShowClearDialog] = useState(false)
    const clearAllData = useAppStore((s) => s.clearAllData)
    const theme = useAppStore((s) => s.theme)
    const setTheme = useAppStore((s) => s.setTheme)

    const handleClearConfirm = () => {
        clearAllData()
        setShowClearDialog(false)
        toast.success("All data cleared.", { position: "top-right" })
    }

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme)
        toast.success(`Theme changed to ${newTheme}.`, { position: "top-right" })
    }
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                        Clear all
                    </DropdownMenuItem>
                    <DropdownMenuGroup>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Configure</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem>Save Path</DropdownMenuItem>
                                    {/* <DropdownMenuItem>Dark</DropdownMenuItem> */}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem 
                                        onClick={() => handleThemeChange("light")}
                                        className={theme === "light" ? "font-semibold" : ""}
                                    >
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => handleThemeChange("dark")}
                                        className={theme === "dark" ? "font-semibold" : ""}
                                    >
                                        Dark
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear all inputs, keys, and encrypted messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearConfirm}>
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default SettingsMenu;