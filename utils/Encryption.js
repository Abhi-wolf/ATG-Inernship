const { rejects } = require("assert");
const crypto = require("crypto");

const secretKey = Buffer.from(process.env.SECRET_KEY, "hex");
const iv = Buffer.from(process.env.IV, "hex");

// ENCRYPTION OF DATA
const EncryptField = (text) => {
  if (!text) return text;

  if (text.startsWith(`{"iv":`)) return text;

  const cipher = crypto.createCipheriv("aes-256-ctr", secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  });
};

// DECRYPTION OF DATA
const DecryptField = (hash) => {
  return new Promise((resolve, reject) => {
    try {
      if (!hash || typeof hash !== "string") {
        console.log("not a string");
        return resolve(hash);
      }

      // Parse the JSON string to check if it contains the necessary fields
      let parsedHash;
      try {
        parsedHash = JSON.parse(hash);
      } catch (parseError) {
        // If parsing fails, it's not in the expected format, so return hash as is
        console.log("parsing error:", parseError);
        return resolve(hash);
      }

      // Check if the parsed object has required properties
      if (!parsedHash.iv || !parsedHash.content) {
        console.log("invalid format");
        return resolve(hash);
      }

      const decipher = crypto.createDecipheriv(
        "aes-256-ctr",
        secretKey,
        Buffer.from(parsedHash.iv, "hex")
      );

      const decryptedData = Buffer.concat([
        decipher.update(Buffer.from(parsedHash.content, "hex")),
        decipher.final(),
      ]);

      return resolve(decryptedData.toString("utf8"));
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = { EncryptField, DecryptField };
