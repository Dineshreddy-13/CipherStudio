import { useState, useEffect } from "react"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"
import { algorithmGroups } from "@/algorithms"
import useAppStore from "@/store/useAppStore"

// Transform your algorithmGroups to match original string format
const stringAlgorithms = algorithmGroups.map(group => ({
  value: group.value,
  items: group.items.map(algo => algo.name) // Just names as strings
}))

const AlgorithmSelector = ({ onSelect }) => {
  const storedAlgorithm = useAppStore((s) => s.algorithm)
  const [value, setValue] = useState(storedAlgorithm?.name || "")

  // Sync with stored algorithm when component remounts or store updates
  useEffect(() => {
    if (storedAlgorithm?.name) {
      setValue(storedAlgorithm.name)
    } else {
      setValue("")
    }
  }, [storedAlgorithm?.name])

  const handleValueChange = (algoName) => {
    setValue(algoName)
    // Find full algorithm object by name
    const fullAlgo = algorithmGroups
      .flatMap(group => group.items)
      .find(algo => algo.name === algoName)

    onSelect?.(fullAlgo)
    // console.log(fullAlgo);
  }

  return (
    <Combobox
      items={stringAlgorithms}  // ← Use transformed string data
      value={value}
      onValueChange={handleValueChange}
    >
      <ComboboxInput placeholder="Select an algorithm" />

      <ComboboxContent>
        <ComboboxEmpty>No algorithms found.</ComboboxEmpty>

        <ComboboxList className="scrollbar-thin">
          {(group, index) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>

              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem
                    key={item}
                    value={item}
                    className={item === value ? "font-semibold" : ""}
                  >
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>

              {index < stringAlgorithms.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export default AlgorithmSelector
