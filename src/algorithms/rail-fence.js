import { formatRailFenceSteps } from '../lib/utils';

/**
 * Rail Fence Cipher (Zigzag Cipher)
 * Symmetric transposition cipher using zigzag pattern
 */

/**
 * Generate the zigzag pattern for encryption
 */
function getZigzagPattern(text, rails) {
  if (rails <= 1) {
    return [text];
  }

  const fence = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;

  for (let i = 0; i < text.length; i++) {
    fence[rail].push(text[i]);
    
    // Change direction at top and bottom rails
    if (rail === 0) {
      direction = 1;
    } else if (rail === rails - 1) {
      direction = -1;
    }
    
    rail += direction;
  }

  return fence;
}

/**
 * Encrypt plaintext using Rail Fence cipher
 */
export function encrypt(plaintext, key) {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('Plaintext cannot be empty');
  }

  if (!key) {
    throw new Error('Key (number of rails) is required');
  }

  const rails = Math.max(2, Math.min(plaintext.length, parseInt(key) || 2));
  const text = plaintext.replace(/\s/g, '');
  
  if (text.length === 0) {
    throw new Error('Text cannot be empty after removing spaces');
  }

  const fence = getZigzagPattern(text, rails);
  const ciphertext = fence.map(rail => rail.join('')).join('');

  const steps = [];
  
  // Record the fence pattern
  for (let rail = 0; rail < rails; rail++) {
    steps.push({
      operation: `rail_${rail}`,
      railNumber: rail,
      characters: fence[rail].join(''),
      charArray: fence[rail],
    });
  }

  return {
    output: ciphertext,
    steps: formatRailFenceSteps({
      mode: 'encrypt',
      plaintext: text,
      key: rails.toString(),
      output: ciphertext,
      fence,
      steps,
    }),
  };
}

/**
 * Decrypt ciphertext using Rail Fence cipher
 */
export function decrypt(ciphertext, key) {
  if (!ciphertext || ciphertext.length === 0) {
    throw new Error('Ciphertext cannot be empty');
  }

  if (!key) {
    throw new Error('Key (number of rails) is required');
  }

  const rails = Math.max(2, Math.min(ciphertext.length, parseInt(key) || 2));
  const len = ciphertext.length;

  // Calculate the number of characters in each rail
  // First, determine the zigzag pattern to know rail lengths
  const railLengths = new Array(rails).fill(0);
  let rail = 0;
  let direction = 1;

  for (let i = 0; i < len; i++) {
    railLengths[rail]++;
    
    if (rail === 0) {
      direction = 1;
    } else if (rail === rails - 1) {
      direction = -1;
    }
    
    rail += direction;
  }

  // Split ciphertext into rails
  const railTexts = [];
  let index = 0;
  for (let r = 0; r < rails; r++) {
    railTexts.push(ciphertext.substring(index, index + railLengths[r]));
    index += railLengths[r];
  }

  // Reconstruct plaintext by reading the zigzag pattern
  let plaintext = '';
  const railIndices = new Array(rails).fill(0);
  rail = 0;
  direction = 1;

  for (let i = 0; i < len; i++) {
    plaintext += railTexts[rail][railIndices[rail]];
    railIndices[rail]++;
    
    if (rail === 0) {
      direction = 1;
    } else if (rail === rails - 1) {
      direction = -1;
    }
    
    rail += direction;
  }

  // Reconstruct fence for visualization
  const fence = getZigzagPattern(plaintext, rails);

  const steps = [];
  
  // Record the rails from ciphertext
  for (let r = 0; r < rails; r++) {
    steps.push({
      operation: `rail_${r}`,
      railNumber: r,
      characters: railTexts[r],
      charArray: railTexts[r].split(''),
    });
  }

  return {
    output: plaintext,
    steps: formatRailFenceSteps({
      mode: 'decrypt',
      plaintext,
      key: rails.toString(),
      ciphertext,
      fence,
      railTexts,
      steps,
    }),
  };
}

export default {
  id: 'rail-fence',
  name: 'Rail Fence Cipher',
  type: 'symmetric',
  description: 'Transposition cipher using zigzag pattern across rails',
  encrypt,
  decrypt,
};
