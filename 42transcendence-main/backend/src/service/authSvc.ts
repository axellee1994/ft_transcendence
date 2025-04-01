import ConstantsPong from '../ConstantsPong';
import * as argon2 from "argon2";

export const option = {
  hashLength: ConstantsPong.ARGON_HASHLENGTH,
  memoryCost: ConstantsPong.ARGON_MEMORYCOST,
  parallelism: ConstantsPong.ARGON_PARALLELISM,
  type: ConstantsPong.ARGON_TYPE,
  saltLength: ConstantsPong.ARGON_SALTLENGTH,
  secret: ConstantsPong.ARGON_SECRET,
};

export const verifyPW  = async(dbhash:string, pw:string) : Promise<boolean> =>{
  console.log(`[verifyPW] Verifying hash (starts with ${dbhash?.substring(0, 10)}...) against provided password.`);
  // Ensure dbhash is a string and looks like a hash
  if (typeof dbhash !== 'string' || !dbhash.startsWith('$')) {
     console.error('[verifyPW] Invalid hash format received:', dbhash);
     return false; // Treat invalid hash as non-match
  }
  // Ensure pw is a string
  if (typeof pw !== 'string') {
      console.error('[verifyPW] Invalid password type received:', typeof pw);
      return false;
  }
  try {
    const isSame = await argon2.verify(dbhash, pw, option); // Uses the same 'option' object
    console.log(`[verifyPW] argon2.verify result: ${isSame}`);
    return isSame;
  } catch (err) {
    console.error("[verifyPW] Error during argon2.verify:", err);
    return false; // Treat verification errors as non-match
  }
}

export const hashPW = async(pw:string) =>{
  // Ensure pw is a string
  if (typeof pw !== 'string') {
      console.error('[hashPW] Invalid password type received:', typeof pw);
      throw new Error("Password must be a string");
  }
  console.log('[hashPW] Hashing password.');
  try {
    const hash = await argon2.hash(pw, option); // Uses the same 'option' object
    console.log(`[hashPW] Hashing successful (hash starts with ${hash?.substring(0, 10)}...).`);
    return hash;
  } catch (err) {
    console.error("[hashPW] Error during argon2.hash:", err);
    throw err; // Rethrow hash errors
  }
}