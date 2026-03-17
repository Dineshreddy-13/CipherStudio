import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { Copy, Check, Key } from "lucide-react"
import { useState } from "react"

const InfoCard = ({ title, description, content }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)

      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Copy failed", err)
    }
  }

  return (
    <Item variant="outline" className="dark:bg-neutral-900">
      <ItemContent>
        <div className="flex justify-between items-start gap-2">
          <div>
            <ItemTitle>{title}</ItemTitle>
            <ItemDescription className="text-xs text-gray-500">
              {description}
            </ItemDescription>
          </div>

          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content}
            >
              {copied ? <Check className="text-green-500" /> : <Copy />}
            </Button>
          </ItemActions>
        </div>

        <Separator />

        <div className="flex items-center justify-center h-20 overflow-y-auto scrollbar-thin break-all">
          <p className="text-green-600 text-xs whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </ItemContent>
    </Item>
  )
}

export default InfoCard
