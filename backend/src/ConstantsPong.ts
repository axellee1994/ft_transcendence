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
  static readonly ARGON_SECRET = Buffer.from(process.env.HASHING_SECRET || "mysecret");

  // constant for jwt secret
  static readonly JWT_SECRET = process.env.JWT_SECRET || "mysecret";
  static readonly JWT_EXPIRY = "20d";

  // time interval for check user activity
  static readonly ONLINE_TIMEOUT = 60000;

  // Avatar size limit 150kb
  static readonly AVATAR_MAXSIZE = 150 * 1024;

  // Gooogle OAuth2 credentials
  static readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  static readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  static readonly GOOGLE_TEMP_PW = process.env.GOOGLE_TEMP_PW || "mysecret";
  static readonly GOOGLE_OAUTH2_API = "https://www.googleapis.com/oauth2/v2/userinfo";
  static readonly GOOGLE_OAUTH2_CALLBACK_URI = "https://localhost:3000/api/auth/google/callback";
  static readonly FRONTEND_ROOT_URL = "https://localhost:3000";
} 

export default ConstantsPong;