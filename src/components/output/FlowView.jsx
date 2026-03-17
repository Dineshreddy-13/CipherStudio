import { useState, useCallback, useEffect } from "react"
import {
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {Workflow} from "lucide-react"
import useAppStore from "@/store/useAppStore"

// Custom node types
const ProcessNode = ({ data }) => {
  return (
    <div className="px-4 py-2 bg-blue-500 text-white rounded-lg border-2 border-blue-600 min-w-35">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-center text-sm">{data.label}</div>
      {data.detail && (
        <div className="text-xs text-center mt-1 opacity-90">{data.detail}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const DecisionNode = ({ data }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />
      <div className="w-32 h-32 bg-yellow-400 border-2 border-yellow-600 rotate-45 flex items-center justify-center">
        <div className="-rotate-45 font-semibold text-sm text-center px-2">
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Right} id="no" style={{ top: '50%' }} />
    </div>
  )
}

const StartEndNode = ({ data }) => {
  return (
    <div className="px-6 py-3 bg-green-500 text-white rounded-full border-2 border-green-600 min-w-35">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-center">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const LoopNode = ({ data }) => {
  return (
    <div className="px-4 py-2 bg-purple-500 text-white rounded-lg border-2 border-purple-600 border-dashed min-w-35">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-center text-sm">{data.label}</div>
      {data.detail && (
        <div className="text-xs text-center mt-1 opacity-90">{data.detail}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="loop" />
    </div>
  )
}

const nodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  loop: LoopNode,
}

// Layout configuration
const LAYOUT = {
  verticalSpacing: 140,
  horizontalSpacing: 400,
  decisionVerticalGap: 180,
  centerX: 400,
}

// Dynamic flowchart layout generator
const createFlowchartLayout = (flowDefinition) => {
  const nodes = []
  const edges = []
  const nodePositions = new Map()
  
  let currentY = 0
  
  const calculatePosition = (nodeData, index) => {
    const { id, type, branch } = nodeData
    let x = LAYOUT.centerX
    
    // Handle branching for decision nodes
    if (branch === 'left') {
      x = LAYOUT.centerX - LAYOUT.horizontalSpacing / 2
    } else if (branch === 'right') {
      x = LAYOUT.centerX + LAYOUT.horizontalSpacing / 2
    }
    
    const position = { x, y: currentY }
    nodePositions.set(id, position)
    
    return position
  }
  
  const processNodes = (nodeDefs) => {
    let i = 0
    const branchRejoins = new Map() // Track where branches rejoin
    
    while (i < nodeDefs.length) {
      const nodeData = nodeDefs[i]
      const position = calculatePosition(nodeData, i)
      
      // Create node
      nodes.push({
        id: nodeData.id,
        type: nodeData.type,
        position,
        data: nodeData.data,
      })
      
      // Handle different node types and edges
      if (nodeData.type === 'decision') {
        // Add edges for both branches
        if (nodeData.branches) {
          edges.push({
            id: `e${nodeData.id}-yes`,
            source: nodeData.id,
            target: nodeData.branches.yes,
            sourceHandle: 'yes',
            label: 'Yes',
            type: 'smoothstep',
            animated: nodeData.loop?.yes,
          })
          
          edges.push({
            id: `e${nodeData.id}-no`,
            source: nodeData.id,
            target: nodeData.branches.no,
            sourceHandle: 'no',
            label: 'No',
            type: 'smoothstep',
            animated: nodeData.loop?.no,
          })
        }
        
        // Add extra space after decision nodes
        currentY += LAYOUT.verticalSpacing + LAYOUT.decisionVerticalGap
      } else {
        // Regular node - add edge to next if specified
        if (nodeData.next) {
          // Check if this is a merge point (coming from branch)
          const nextNode = nodeDefs.find(n => n.id === nodeData.next)
          const isMerge = nodeData.branch && nextNode && !nextNode.branch
          
          edges.push({
            id: `e${nodeData.id}-${nodeData.next}`,
            source: nodeData.id,
            target: nodeData.next,
            type: isMerge ? 'smoothstep' : 'default',
          })
        }
        
        currentY += LAYOUT.verticalSpacing
      }
      
      i++
    }
  }
  
  processNodes(flowDefinition)
  
  return { nodes, edges }
}

// Algorithm flow definitions (structure only, positions calculated automatically)
const algorithmFlows = {
  caesar: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Shift (K)', detail: 'K = 0-25' }, next: '3' },
      { id: '3', type: 'loop', data: { label: 'For each char', detail: 'i = 0 to length' }, next: '4' },
      { id: '4', type: 'decision', data: { label: 'Is Alpha?' }, branches: { yes: '5', no: '6' } },
      { id: '5', type: 'process', data: { label: 'Shift Char', detail: '(char + K) mod 26' }, next: '7', branch: 'left' },
      { id: '6', type: 'process', data: { label: 'Keep Char', detail: 'No change' }, next: '7', branch: 'right' },
      { id: '7', type: 'process', data: { label: 'Append to Result' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '3', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Shift (K)', detail: 'K = 0-25' }, next: '3' },
      { id: '3', type: 'loop', data: { label: 'For each char', detail: 'i = 0 to length' }, next: '4' },
      { id: '4', type: 'decision', data: { label: 'Is Alpha?' }, branches: { yes: '5', no: '6' } },
      { id: '5', type: 'process', data: { label: 'Reverse Shift', detail: '(char - K) mod 26' }, next: '7', branch: 'left' },
      { id: '6', type: 'process', data: { label: 'Keep Char', detail: 'No change' }, next: '7', branch: 'right' },
      { id: '7', type: 'process', data: { label: 'Append to Result' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '3', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  xor: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Key', detail: 'Secret key' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Extend Key', detail: 'Repeat to match length' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each byte', detail: 'i = 0 to length' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'XOR Operation', detail: 'byte ⊕ key[i]' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Store Result' }, next: '7' },
      { id: '7', type: 'decision', data: { label: 'More bytes?' }, branches: { yes: '4', no: '8' }, loop: { yes: true } },
      { id: '8', type: 'process', data: { label: 'Convert to Hex' }, next: '9' },
      { id: '9', type: 'startEnd', data: { label: 'Ciphertext (Hex)' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext (Hex)' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Parse Hex', detail: 'Convert to bytes' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Key', detail: 'Secret key' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Extend Key', detail: 'Repeat to match length' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each byte', detail: 'i = 0 to length' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'XOR Operation', detail: 'byte ⊕ key[i]' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Store Result' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More bytes?' }, branches: { yes: '5', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
    des: {
      encrypt: [
        { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
        { id: '2', type: 'process', data: { label: 'Initial Permutation', detail: 'Prepare input' }, next: '3' },
        { id: '3', type: 'process', data: { label: 'Split Halves', detail: 'L | R' }, next: '4' },
        { id: '4', type: 'loop', data: { label: 'For 16 rounds', detail: 'i = 1..16' }, next: '5' },
        { id: '5', type: 'process', data: { label: 'Round Function', detail: 'F(R, K_i) and XOR with L' }, next: '6' },
        { id: '6', type: 'decision', data: { label: 'More rounds?' }, branches: { yes: '4', no: '7' }, loop: { yes: true } },
        { id: '7', type: 'process', data: { label: 'Final Permutation', detail: 'Combine halves' }, next: '8' },
        { id: '8', type: 'startEnd', data: { label: 'Ciphertext (B64)' } },
      ],
      decrypt: [
        { id: '1', type: 'startEnd', data: { label: 'Ciphertext (B64)' }, next: '2' },
        { id: '2', type: 'process', data: { label: 'Reverse Final Permutation', detail: 'Prepare halves' }, next: '3' },
        { id: '3', type: 'loop', data: { label: 'For 16 rounds (reverse)', detail: 'i = 16..1' }, next: '4' },
        { id: '4', type: 'process', data: { label: 'Round Function (reverse)', detail: 'Apply inverse round' }, next: '5' },
        { id: '5', type: 'decision', data: { label: 'More rounds?' }, branches: { yes: '3', no: '6' }, loop: { yes: true } },
        { id: '6', type: 'process', data: { label: 'Finalize', detail: 'Combine and output' }, next: '7' },
        { id: '7', type: 'startEnd', data: { label: 'Plaintext' } },
      ],
    },
  vigenere: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Key', detail: 'Keyword' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Extend Key', detail: 'Repeat to match length' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each char', detail: 'i = 0 to length' }, next: '5' },
      { id: '5', type: 'decision', data: { label: 'Is Alpha?' }, branches: { yes: '6', no: '8' } },
      { id: '6', type: 'process', data: { label: 'Get Key Shift', detail: 'key[i] - A' }, next: '7', branch: 'left' },
      { id: '7', type: 'process', data: { label: 'Shift Char', detail: '(char + shift) mod 26' }, next: '9', branch: 'left' },
      { id: '8', type: 'process', data: { label: 'Keep Char', detail: 'No change' }, next: '9', branch: 'right' },
      { id: '9', type: 'process', data: { label: 'Append to Result' }, next: '10' },
      { id: '10', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '4', no: '11' }, loop: { yes: true } },
      { id: '11', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Key', detail: 'Keyword' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Extend Key', detail: 'Repeat to match length' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each char', detail: 'i = 0 to length' }, next: '5' },
      { id: '5', type: 'decision', data: { label: 'Is Alpha?' }, branches: { yes: '6', no: '8' } },
      { id: '6', type: 'process', data: { label: 'Get Key Shift', detail: 'key[i] - A' }, next: '7', branch: 'left' },
      { id: '7', type: 'process', data: { label: 'Reverse Shift', detail: '(char - shift) mod 26' }, next: '9', branch: 'left' },
      { id: '8', type: 'process', data: { label: 'Keep Char', detail: 'No change' }, next: '9', branch: 'right' },
      { id: '9', type: 'process', data: { label: 'Append to Result' }, next: '10' },
      { id: '10', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '4', no: '11' }, loop: { yes: true } },
      { id: '11', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  playfair: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Prepare Text', detail: 'Remove spaces, X for doubles' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Build 5x5 Matrix', detail: 'From keyword + alphabet' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Split into Digraphs', detail: 'Pairs of letters' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each digraph' }, next: '6' },
      { id: '6', type: 'decision', data: { label: 'Same row?' }, branches: { yes: '7', no: '8' } },
      { id: '7', type: 'process', data: { label: 'Shift Right', detail: 'Next column' }, next: '11', branch: 'left' },
      { id: '8', type: 'decision', data: { label: 'Same col?' }, branches: { yes: '9', no: '10' }, branch: 'right' },
      { id: '9', type: 'process', data: { label: 'Shift Down', detail: 'Next row' }, next: '11', branch: 'left' },
      { id: '10', type: 'process', data: { label: 'Rectangle Rule', detail: 'Opposite corners' }, next: '11', branch: 'right' },
      { id: '11', type: 'process', data: { label: 'Append Digraph' }, next: '12' },
      { id: '12', type: 'decision', data: { label: 'More pairs?' }, branches: { yes: '5', no: '13' }, loop: { yes: true } },
      { id: '13', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Build 5x5 Matrix', detail: 'From keyword + alphabet' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Split into Digraphs', detail: 'Pairs of letters' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each digraph' }, next: '5' },
      { id: '5', type: 'decision', data: { label: 'Same row?' }, branches: { yes: '6', no: '7' } },
      { id: '6', type: 'process', data: { label: 'Shift Left', detail: 'Previous column' }, next: '10', branch: 'left' },
      { id: '7', type: 'decision', data: { label: 'Same col?' }, branches: { yes: '8', no: '9' }, branch: 'right' },
      { id: '8', type: 'process', data: { label: 'Shift Up', detail: 'Previous row' }, next: '10', branch: 'left' },
      { id: '9', type: 'process', data: { label: 'Rectangle Rule', detail: 'Opposite corners' }, next: '10', branch: 'right' },
      { id: '10', type: 'process', data: { label: 'Append Digraph' }, next: '11' },
      { id: '11', type: 'decision', data: { label: 'More pairs?' }, branches: { yes: '4', no: '12' }, loop: { yes: true } },
      { id: '12', type: 'process', data: { label: 'Remove Padding', detail: 'Remove X characters' }, next: '13' },
      { id: '13', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  transposition: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Remove Spaces', detail: 'Clean text' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Key', detail: 'Column order' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Calculate Cols', detail: 'cols = key length' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Fill Matrix', detail: 'Write row by row' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Pad if Needed', detail: 'Add X to fill last row' }, next: '7' },
      { id: '7', type: 'loop', data: { label: 'For each key position', detail: 'In sorted order' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Read Column', detail: 'Top to bottom' }, next: '9' },
      { id: '9', type: 'process', data: { label: 'Append to Result' }, next: '10' },
      { id: '10', type: 'decision', data: { label: 'More cols?' }, branches: { yes: '7', no: '11' }, loop: { yes: true } },
      { id: '11', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Key', detail: 'Column order' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Calculate Rows', detail: 'rows = len / key_len' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Determine Col Lengths', detail: 'Handle padding' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each key position', detail: 'In sorted order' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Extract Column', detail: 'Get next N chars' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Place in Matrix', detail: 'Original key position' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More cols?' }, branches: { yes: '5', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'process', data: { label: 'Read Rows', detail: 'Left to right' }, next: '10' },
      { id: '10', type: 'process', data: { label: 'Remove Padding', detail: 'Trim X characters' }, next: '11' },
      { id: '11', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  rsa: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'UTF-8 Encode', detail: 'Convert to bytes' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'OAEP Padding', detail: 'Add random padding' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Convert to Number', detail: 'M = bytes to integer' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Get Public Key', detail: '(e, n)' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Modular Exp', detail: 'C = M^e mod n' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Convert to Bytes' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Base64 Encode', detail: 'Safe transport format' }, next: '9' },
      { id: '9', type: 'startEnd', data: { label: 'Ciphertext (B64)' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext (B64)' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Base64 Decode', detail: 'Get bytes' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Convert to Number', detail: 'C = bytes to integer' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Get Private Key', detail: '(d, n)' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Modular Exp', detail: 'M = C^d mod n' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Convert to Bytes' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Remove OAEP', detail: 'Unpad message' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'UTF-8 Decode', detail: 'Bytes to text' }, next: '9' },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  aes: {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Prepare Key', detail: 'Validate/pad to 16/24/32 bytes' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'UTF-8 Encode', detail: 'Convert text to bytes' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Generate IV', detail: 'Random 12-byte initialization vector' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'AES-GCM Encrypt', detail: 'Apply AES cipher' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Generate Auth Tag', detail: 'GCM authentication' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Combine IV + Ciphertext', detail: 'Prepend IV to output' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Base64 Encode', detail: 'Safe text format' }, next: '9' },
      { id: '9', type: 'startEnd', data: { label: 'Ciphertext (B64)' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext (B64)' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Base64 Decode', detail: 'Convert to binary' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Extract IV', detail: 'First 12 bytes' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Extract Ciphertext', detail: 'Remaining bytes' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Prepare Key', detail: 'Validate/pad to 16/24/32 bytes' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'AES-GCM Decrypt', detail: 'Apply AES cipher' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Verify Auth Tag', detail: 'GCM authentication' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'UTF-8 Decode', detail: 'Bytes to text' }, next: '9' },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  "diffie-hellman": {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Public Key', detail: 'e and p parameters' }, next: '3' },
      { id: '3', type: 'loop', data: { label: 'For each character', detail: 'i = 0 to length' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Convert to ASCII', detail: 'Get numeric value' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Encrypt Character', detail: 'C = M^e mod p' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Convert to Hex', detail: '4-digit padding' }, next: '7' },
      { id: '7', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '3', no: '8' }, loop: { yes: true } },
      { id: '8', type: 'startEnd', data: { label: 'Ciphertext (Hex)' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext (Hex)' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Private Key', detail: 'd and p parameters' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Parse Hex Chunks', detail: 'Split into 4-char groups' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each chunk', detail: 'i = 0 to length' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Convert Hex to Number', detail: 'Parse hex value' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Decrypt Chunk', detail: 'M = C^d mod p' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Convert to Character', detail: 'ASCII to char' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More chunks?' }, branches: { yes: '4', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  "elgamal": {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Public Key', detail: 'p, g, h' }, next: '3' },
      { id: '3', type: 'loop', data: { label: 'For each char', detail: 'i = 0 to length' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Pick ephemeral y', detail: 'random 2..p-2' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Compute c1', detail: 'c1 = g^y mod p' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Compute c2', detail: 'c2 = m * h^y mod p' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Append pair', detail: 'c1||c2 (hex)' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '3', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Ciphertext (Hex Pairs)' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext (Hex Pairs)' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Private Key', detail: 'p, x' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Split pairs', detail: 'c1 || c2' }, next: '4' },
      { id: '4', type: 'loop', data: { label: 'For each pair', detail: 'i = 0 to length' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Compute s', detail: 's = c1^x mod p' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Compute s^-1', detail: 'mod inverse of s' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Recover m', detail: 'm = c2 * s^-1 mod p' }, next: '8' },
      { id: '8', type: 'decision', data: { label: 'More pairs?' }, branches: { yes: '4', no: '9' }, loop: { yes: true } },
      { id: '9', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  "hill": {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Key Matrix', detail: '2x2 matrix K' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Get Modulus', detail: 'Prime 257' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Pad Text', detail: 'Make length even' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each 2-char block', detail: 'Process in pairs' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Convert to ASCII Values', detail: 'Get numeric values' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Apply Matrix', detail: 'P = K * [M1, M2]^T' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Modulo Operation', detail: 'Result mod 257' }, next: '9' },
      { id: '9', type: 'process', data: { label: 'Convert to Characters', detail: 'Back to ASCII' }, next: '10' },
      { id: '10', type: 'process', data: { label: 'Append to Ciphertext' }, next: '11' },
      { id: '11', type: 'decision', data: { label: 'More blocks?' }, branches: { yes: '5', no: '12' }, loop: { yes: true } },
      { id: '12', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Key Matrix', detail: '2x2 matrix K' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Get Modulus', detail: 'Prime 257' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Calculate Inverse', detail: 'K^-1 mod 257' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each 2-char block', detail: 'Process in pairs' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Convert to ASCII Values', detail: 'Get numeric values' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Apply Inverse Matrix', detail: 'P = K^-1 * [C1, C2]^T' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Modulo Operation', detail: 'Result mod 257' }, next: '9' },
      { id: '9', type: 'process', data: { label: 'Convert to Characters', detail: 'Back to ASCII' }, next: '10' },
      { id: '10', type: 'process', data: { label: 'Append to Plaintext' }, next: '11' },
      { id: '11', type: 'decision', data: { label: 'More blocks?' }, branches: { yes: '5', no: '12' }, loop: { yes: true } },
      { id: '12', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
  "rail-fence": {
    encrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Plaintext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Remove Spaces', detail: 'Clean text' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Get Number of Rails', detail: 'Key parameter' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Create Fence', detail: 'Empty rails array' }, next: '5' },
      { id: '5', type: 'loop', data: { label: 'For each character', detail: 'i = 0 to length' }, next: '6' },
      { id: '6', type: 'process', data: { label: 'Add to Current Rail', detail: 'Zigzag pattern' }, next: '7' },
      { id: '7', type: 'decision', data: { label: 'Direction?', detail: 'Top/Bottom boundaries' }, branches: { yes: '8', no: '9' } },
      { id: '8', type: 'process', data: { label: 'Change Direction', detail: 'Reverse zigzag' }, next: '10', branch: 'left' },
      { id: '9', type: 'process', data: { label: 'Continue Direction', detail: 'Keep zigzag' }, next: '10', branch: 'right' },
      { id: '10', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '5', no: '11' }, loop: { yes: true } },
      { id: '11', type: 'process', data: { label: 'Read Rails Row by Row', detail: 'Top to bottom' }, next: '12' },
      { id: '12', type: 'startEnd', data: { label: 'Ciphertext' } },
    ],
    decrypt: [
      { id: '1', type: 'startEnd', data: { label: 'Ciphertext' }, next: '2' },
      { id: '2', type: 'process', data: { label: 'Get Number of Rails', detail: 'Key parameter' }, next: '3' },
      { id: '3', type: 'process', data: { label: 'Calculate Rail Lengths', detail: 'Zigzag pattern analysis' }, next: '4' },
      { id: '4', type: 'process', data: { label: 'Split Into Rails', detail: 'Partition ciphertext' }, next: '5' },
      { id: '5', type: 'process', data: { label: 'Create Rail Index Array', detail: 'Track positions' }, next: '6' },
      { id: '6', type: 'loop', data: { label: 'For each character', detail: 'Reconstruct zigzag' }, next: '7' },
      { id: '7', type: 'process', data: { label: 'Read from Current Rail', detail: 'Zigzag pattern' }, next: '8' },
      { id: '8', type: 'process', data: { label: 'Increment Rail Index', detail: 'Move to next char' }, next: '9' },
      { id: '9', type: 'decision', data: { label: 'Direction?', detail: 'Top/Bottom boundaries' }, branches: { yes: '10', no: '11' } },
      { id: '10', type: 'process', data: { label: 'Change Direction', detail: 'Reverse zigzag' }, next: '12', branch: 'left' },
      { id: '11', type: 'process', data: { label: 'Continue Direction', detail: 'Keep zigzag' }, next: '12', branch: 'right' },
      { id: '12', type: 'decision', data: { label: 'More chars?' }, branches: { yes: '6', no: '13' }, loop: { yes: true } },
      { id: '13', type: 'startEnd', data: { label: 'Plaintext' } },
    ],
  },
}

// Main generator function
const generateFlowchart = (algorithm, mode = "encrypt") => {
  const flowDef = algorithmFlows[algorithm?.id]?.[mode]
  if (!flowDef) {
    return { nodes: [], edges: [] }
  }
  
  return createFlowchartLayout(flowDef)
}

const FlowchartView = ({ algorithm, mode }) => {
  const { nodes: initialNodes, edges: initialEdges } = generateFlowchart(algorithm, mode)
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const theme = useAppStore((s) => s.theme)


  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateFlowchart(algorithm, mode)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [algorithm?.id, mode])

  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  )
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  )

  return (
    <div className="w-full h-full bg-linear-to-br from-slate-50 to-slate-100">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        colorMode={`${(theme == "dark") ? "dark" : "light"}`}
      >
        <Background color="#171717"/>
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  )
}

const FlowView = ({ algorithm, steps = {}, mode = "encrypt" }) => {
  const hasSteps = steps && Object.keys(steps).length > 0
  return (
    <div className="flex flex-col h-[60vh] rounded-2xl overflow-hidden border ">
      {!algorithm ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Workflow size={48} className="opacity-50" />
          Select an algorithm
        </div>
      ) : hasSteps ? (
        <FlowchartView algorithm={algorithm} mode={mode} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Workflow size={48} className="opacity-50" />
          Perform {mode} to generate flowchart
        </div>
      )}
    </div>
  )
}

export default FlowView