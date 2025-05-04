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
  const isSame = await argon2.verify(dbhash, pw, option);
  return isSame;
}

export const hashPW = async(pw:string) =>{
  const hash = await argon2.hash(pw, option);
  return hash;
}