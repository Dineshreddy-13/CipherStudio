import xorCipher from "./xor"
import rsaCipher from "./rsa"
import vigenereCipher from "./vigenere"
import playfairCipher from "./playfair"
import transpositionCipher from "./transposition"
import caesarCipher from "./caesar"
import aesCipher from "./aes"
import desCipher from "./des"
import diffieHellmanCipher from "./diffie-hellman"
import hillCipher from "./hill"
import railFenceCipher from "./rail-fence"
import elgamalCipher from "./elgamal"

export const algorithms = [
  caesarCipher,
  xorCipher,
  vigenereCipher,
  playfairCipher,
  transpositionCipher,
  aesCipher,
  desCipher,
  hillCipher,
  railFenceCipher,
  elgamalCipher,
  rsaCipher,
  diffieHellmanCipher,
]

export const algorithmGroups = [
  {
    value: "Symmetric",
    items: [caesarCipher, xorCipher, vigenereCipher, playfairCipher, transpositionCipher, aesCipher, desCipher, hillCipher, railFenceCipher],
  },
  {
    value: "Asymmetric",
    items: [rsaCipher, diffieHellmanCipher, elgamalCipher],
  },
]

export const getAlgorithmById = (id) =>
  algorithms.find(algo => algo.id === id)
