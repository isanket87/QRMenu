const CryptoJS = require('crypto-js');
require('dotenv').config();

const secretKey = process.env.ENCRYPTION_SECRET_KEY;

if (!secretKey) {
    throw new Error('ENCRYPTION_SECRET_KEY is not defined in the environment variables.');
}

/**
 * Encrypts a text string using AES and makes it URL-safe.
 * @param {string} text The text to encrypt.
 * @returns {string} The URL-safe, encrypted string.
 */
//  function encrypt(text) {
//     if (!text) return "";
//     // Encrypt the text using AES encryption
//     const encrypted = CryptoJS.AES.encrypt(text, secretKey).toString();
//     return encrypted.toString();
//   }
    const SECRET = BigInt("98765432101234567890987654321");

  // ---------- ENCODE ----------
  function encrypt(n) {
    return (BigInt(n) * SECRET).toString(); // gives huge number
  }

  function decodeNumber(bigStr) {
  return (BigInt(bigStr) / SECRET).toString(); // back to original
}
/**
 * Decrypts a URL-safe, encrypted string.
 * @param {string} encryptedText The URL-safe, encrypted text.
 * @returns {string} The original decrypted text.
 */
function decrypt(encryptedText) {
  // First, decode the URL component to get the original Base64 ciphertext.
  const ciphertext = decodeURIComponent(encryptedText);
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt, decodeNumber };