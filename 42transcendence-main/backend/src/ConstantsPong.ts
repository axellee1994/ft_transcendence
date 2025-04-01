import dotenv from "dotenv";
import { argon2i } from "argon2";

dotenv.config();

class ConstantsPong {
  // constants for argon2
  static readonly ARGON_HASHLENGTH = 128;
  static readonly ARGON_MEMORYCOST = 131072;
  static readonly ARGON_PARALLELISM = 4;
  static readonly ARGON_TYPE = argon2i;
  static readonly ARGON_SALTLENGTH = 32;
  static readonly ARGON_SECRET = Buffer.from(process.env.HASHING_SECRET || "uKDFkACTga43Qz9Z7V5vGWERXcsdr6hL");

  // constant for jwt secret
  static readonly JWT_SECRET = process.env.JWT_SECRET || "n6r8bhHVU9qJ3Rvf7tdYA4ZTPD2pKBjy";
  static readonly JWT_EXPIRY = "20d";
}

export default ConstantsPong;