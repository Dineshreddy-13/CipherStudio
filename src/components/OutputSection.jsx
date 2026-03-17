import StepsView from "./output/StepsView"
import FlowView from "./output/FlowView"

const OutputSection = ({ algorithm, steps = [], mode = "encrypt" }) => {
  return (
    <div className="grid grid-cols-2 gap-5 px-8 mb-5">
      <StepsView algorithm={algorithm} steps={steps} />
      <FlowView algorithm={algorithm} steps={steps} mode={mode} />
    </div>
  )
}

export default OutputSection
