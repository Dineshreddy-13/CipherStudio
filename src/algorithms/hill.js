import { formatHillCipherSteps } from '../lib/utils';

/**
 * Hill Cipher - Block cipher using matrix multiplication
 * Uses 2x2 key matrix for block size of 2 characters
 */

const HILL_PRIMES = [
  { p: 26, name: 'Alphabetic (26)' },
  { p: 256, name: 'ASCII (256)' },
];

/**
 * Matrix multiplication modulo p
 */
function matrixMultiply(matrix1, matrix2, mod) {
  const result = [];
  for (let i = 0; i < matrix1.length; i++) {
    result[i] = [];
    for (let j = 0; j < matrix2[0].length; j++) {
      let sum = 0n;
      for (let k = 0; k < matrix1[0].length; k++) {
        sum += BigInt(matrix1[i][k]) * BigInt(matrix2[k][j]);
      }
      result[i][j] = Number(sum % BigInt(mod));
    }
  }
  return result;
}

/**
 * Matrix determinant calculation
 * For 2x2 matrix: det = ad - bc
 */
function matrixDeterminant(matrix) {
  if (matrix.length === 2 && matrix[0].length === 2) {
    return BigInt(matrix[0][0]) * BigInt(matrix[1][1]) - BigInt(matrix[0][1]) * BigInt(matrix[1][0]);
  }
  throw new Error('Only 2x2 matrices supported');
}

/**
 * Modular inverse using Extended Euclidean Algorithm
 */
function modInverse(a, mod) {
  a = BigInt(a) % BigInt(mod);
  for (let x = 1n; x < BigInt(mod); x++) {
    if ((a * x) % BigInt(mod) === 1n) {
      return Number(x);
    }
  }
  throw new Error(`${a} has no modular inverse modulo ${mod}`);
}

/**
 * Matrix inverse modulo p
 * For 2x2: [[a,b],[c,d]]^-1 = (1/det) * [[d,-b],[-c,a]]
 */
function matrixInverse(matrix, mod) {
  const det = matrixDeterminant(matrix);
  const detMod = Number(det % BigInt(mod));
  
  if (detMod === 0) {
    throw new Error('Matrix is not invertible (determinant ≡ 0)');
  }

  const detInv = modInverse(detMod, mod);
  
  const inverse = [
    [
      (detInv * matrix[1][1]) % mod,
      (-detInv * matrix[0][1]) % mod,
    ],
    [
      (-detInv * matrix[1][0]) % mod,
      (detInv * matrix[0][0]) % mod,
    ],
  ];

  // Ensure positive values
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      inverse[i][j] = ((inverse[i][j] % mod) + mod) % mod;
    }
  }

  return inverse;
}

/**
 * Generate random key matrix
 */
function generateKeyMatrix(mod) {
  let matrix, det;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    matrix = [
      [Math.floor(Math.random() * mod), Math.floor(Math.random() * mod)],
      [Math.floor(Math.random() * mod), Math.floor(Math.random() * mod)],
    ];
    det = matrixDeterminant(matrix);
    attempts++;
  } while ((Number(det) % mod === 0 || det === 0n) && attempts < maxAttempts);

  if (attempts === maxAttempts) {
    throw new Error('Failed to generate invertible key matrix');
  }

  return matrix;
}

/**
 * Encrypt plaintext using Hill cipher
 */
export function encrypt(plaintext, key, mod = 256) {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('Plaintext cannot be empty');
  }

  if (!key || !key.matrix) {
    throw new Error('Invalid key structure: requires matrix property');
  }

  const keyMatrix = key.matrix;
  const steps = [];
  let ciphertext = '';
  const paddedText = plaintext.length % 2 === 0 ? plaintext : plaintext + '\0';

  // Process plaintext in blocks of 2
  for (let i = 0; i < paddedText.length; i += 2) {
    const char1 = paddedText.charCodeAt(i);
    const char2 = paddedText.charCodeAt(i + 1);

    const plainBlock = [[char1], [char2]];
    const cipherBlock = matrixMultiply(keyMatrix, plainBlock, mod);

    const encChar1 = String.fromCharCode(cipherBlock[0][0]);
    const encChar2 = String.fromCharCode(cipherBlock[1][0]);

    ciphertext += encChar1 + encChar2;

    steps.push({
      operation: 'encrypt_block',
      plainChars: `${String.fromCharCode(char1)}${String.fromCharCode(char2)}`,
      plainValues: `[${char1}, ${char2}]`,
      keyMatrix: keyMatrix,
      result: `[${cipherBlock[0][0]} mod 257, ${cipherBlock[1][0]} mod 257]`,
      resultChars: encChar1 + encChar2,
    });
  }

  return {
    ciphertext,
    steps: formatHillCipherSteps({
      mode: 'encrypt',
      plaintext,
      keyMatrix,
      mod,
      steps,
    }),
  };
}

/**
 * Decrypt ciphertext using Hill cipher
 */
export function decrypt(ciphertext, key, mod = 256) {
  if (!ciphertext || ciphertext.length === 0) {
    throw new Error('Ciphertext cannot be empty');
  }

  if (!ciphertext || ciphertext.length % 2 !== 0) {
    throw new Error('Ciphertext length must be even');
  }

  if (!key || !key.matrix) {
    throw new Error('Invalid key structure: requires matrix property');
  }

  const keyMatrix = key.matrix;
  const inverseMatrix = matrixInverse(keyMatrix, mod);
  const steps = [];
  let plaintext = '';

  // Process ciphertext in blocks of 2
  for (let i = 0; i < ciphertext.length; i += 2) {
    const char1 = ciphertext.charCodeAt(i);
    const char2 = ciphertext.charCodeAt(i + 1);

    const cipherBlock = [[char1], [char2]];
    const plainBlock = matrixMultiply(inverseMatrix, cipherBlock, mod);

    const decChar1 = plainBlock[0][0];
    const decChar2 = plainBlock[1][0];

    // Skip null padding
    if (decChar1 !== 0) plaintext += String.fromCharCode(decChar1);
    if (decChar2 !== 0) plaintext += String.fromCharCode(decChar2);

    steps.push({
      operation: 'decrypt_block',
      cipherChars: `${String.fromCharCode(char1)}${String.fromCharCode(char2)}`,
      cipherValues: `[${char1}, ${char2}]`,
      inverseMatrix: inverseMatrix,
      result: `[${decChar1}, ${decChar2}]`,
      resultChars: `${String.fromCharCode(decChar1)}${String.fromCharCode(decChar2)}`,
    });
  }

  return {
    plaintext,
    steps: formatHillCipherSteps({
      mode: 'decrypt',
      ciphertext,
      keyMatrix,
      inverseMatrix,
      mod,
      steps,
    }),
  };
}

export default {
  id: 'hill',
  name: 'Hill Cipher',
  type: 'symmetric',
  description: 'Block cipher using matrix multiplication (2x2 key matrix)',
  encrypt,
  decrypt,
  primes: HILL_PRIMES,
};
