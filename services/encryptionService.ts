
const SECRET_SALT = "TEVOLTA_INTERNAL_2025";

/**
 * Simple obfuscation/encryption for storing passwords in the JSON database.
 * This prevents plain-text visibility if the file is opened in a text editor.
 */
export const encryptPassword = (password: string | undefined): string => {
  if (!password) return "";
  if (password.startsWith("ENC:")) return password; // Avoid double encryption
  
  // Basic reversible XOR/Base64 obfuscation for client-side storage
  const combined = `${SECRET_SALT}:${password}`;
  const encoded = btoa(combined);
  return `ENC:${encoded}`;
};

export const decryptPassword = (encrypted: string | undefined): string => {
  if (!encrypted) return "";
  if (!encrypted.startsWith("ENC:")) return encrypted; // Return as is if not encrypted
  
  try {
    const base64 = encrypted.substring(4);
    const decoded = atob(base64);
    const parts = decoded.split(":");
    return parts.length > 1 ? parts.slice(1).join(":") : decoded;
  } catch (e) {
    console.error("Decryption failed", e);
    return encrypted;
  }
};
