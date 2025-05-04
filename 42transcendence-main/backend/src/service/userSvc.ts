import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import { hashPW } from "./authSvc";
import ServerRequestError from "../error/ServerRequestError";
import BadRequestError from "../error/BadRequestError";
import { Iuser, IuserCreated, Itwofas, IUserOnlineStatus, IUserSearchOnlineStatus } from "../model/userModel";
import sizeOf from 'image-size';
import crypto from 'crypto';
import { verifyPW } from '../service/authSvc';

export const isExist = async (fastify : FastifyInstance, username:string, email:string): Promise<boolean> =>{
  try{
    const result = await fastify.db.get<string>(SQLStatement.USER_GET_ID, [username, email]);
    return result?true:false;
  }
  catch(error : unknown){
    throw new ServerRequestError({message:"Server error"});
  }
}

export const createUser = async(fastify : FastifyInstance, username : string, email : string, pw : string) =>{
  try{
    const hashedpw = await hashPW(pw);
    const result = await fastify.db.run(SQLStatement.USER_CREATE_USER, [username, email, hashedpw]);
    const user = await fastify.db.get<IuserCreated>(SQLStatement.USER_GET_CREATED_INFO, result.lastID);
    if (user)
      return user;
    throw new BadRequestError({message:"User does not exist"});
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"Server error"});
  }
}

export const updateIsRemoteUser = async(fastify:FastifyInstance, userid:number) =>
{
  try
  {
    await fastify.db.run(SQLStatement.USER_SET_IS_REMOTE_USER, userid);
  }
  catch(error:unknown)
  {
    throw new ServerRequestError({message:"Db error"});
  }
}


export const getAllUser = async(fastify:FastifyInstance) =>{
  try {
    const users = await fastify.db.all<Iuser[]>(SQLStatement.USER_GET_ALL);
    return users;
} catch (err:unknown) {
  throw new ServerRequestError({message : "DB Erorr"});
}
}

export const getUserInfobyUserName = async(fastify:FastifyInstance, username:string) =>{
  try{
    const user = await fastify.db.get<Iuser>(SQLStatement.USER_GET_INFO, username);
    return user;
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const getUserByID = async(fastify:FastifyInstance, userid:number) =>{
  try{
    const user = await fastify.db.get<Iuser>(SQLStatement.USER_GET_BY_ID, userid);
    return user;
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const getUserOnlineStatus = async(fastify:FastifyInstance, userid:number) =>{
  try {
    const userStatus = await fastify.db.get<IUserOnlineStatus>(SQLStatement.USER_GET_ONLINE_STATUS, userid);
    return userStatus;
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const getUserOnlineStatusByUsernameOrDisplayName = async(fastify : FastifyInstance, query:string) =>{
  try {
    const users = await fastify.db.all<IUserSearchOnlineStatus[]>(
      SQLStatement.USER_ONLINE_STATUS_BY_USERNAME_OR_DISPLAYNAME,
      [`%${query}%`, `%${query}%`]
    );
  return users;
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setOnlineStatusByID = async(fastify:FastifyInstance, userid:number, status:boolean) =>{
  try{
    await fastify.db.run(SQLStatement.USER_SET_ONLINE_STATUS, status?1:0, userid);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"Db error"});
  }
}

export const isValidImg = async (img64: string) => {
  if (!img64 || !img64.startsWith('data:image'))
    return false;
  try
  {
    const base64Data = img64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64'); 
    const dimensions = sizeOf(buffer);
    return !!(dimensions && dimensions.width && dimensions.height);
  }
  catch (error)
  {
    console.error("Error validating image:", error);
    return false;
  }
};

export const getBase64ImgSize = (base64Str :string) => {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer.length;
};

export const setUserAvatar = async(fastify : FastifyInstance, img64 : string, userid:number) =>{
  try {
    await fastify.db.run(SQLStatement.USERSETTING_SET_AVATAR, [img64, userid]);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setUserUserName = async(fastify : FastifyInstance, username : string, userid:number) =>{
  try {
    await fastify.db.run(SQLStatement.USERSETTING_SET_USERNAME, [username, userid]);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setUserEmail = async(fastify : FastifyInstance, email : string, userid:number) =>{
  try {
    await fastify.db.run(SQLStatement.USERSETTING_SET_EMAIL, [email, userid]);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setUserDisplayName = async(fastify : FastifyInstance, displayName : string, userid:number) =>{
  try {
    await fastify.db.run(SQLStatement.USERSETTING_SET_DISPLAYNAME, [displayName, userid]);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const isUniqueDisplayName = async(fastify : FastifyInstance, displayName : string, userid:number): Promise<boolean> =>{
  try 
  {
    const row = await fastify.db.get<{ count: number }>(SQLStatement.USERSETTING_GET_DISPLAYNAME_COUNT, [displayName, userid]);
    const count = row?.count ?? 0;
    if (count > 0)
      return (false);
    else
      return (true);
  } catch (error)
  {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const isUniqueUserName = async(fastify : FastifyInstance, userName : string, userid:number): Promise<boolean> =>{
  try 
  {
    const row = await fastify.db.get<{ count: number }>(SQLStatement.USERSETTING_GET_USERNAME_COUNT, [userName, userid]);
    const count = row?.count ?? 0;
    if (count > 0)
      return (false);
    else
      return (true);
  } catch (error)
  {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const isUniqueEmail = async(fastify : FastifyInstance, email : string, userid:number): Promise<boolean> =>{
  try 
  {
    const row = await fastify.db.get<{ count: number }>(SQLStatement.USERSETTING_GET_EMAIL_COUNT, [email, userid]);
    const count = row?.count ?? 0;
    if (count > 0)
      return (false);
    else
      return (true);
  } catch (error)
  {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setUserPWHash = async(fastify : FastifyInstance, pwHash : string, userid:number) =>{
  try {
    await fastify.db.run(SQLStatement.USERSETTING_SET_PW_HASH, [pwHash, userid]);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const generate2FaCode = async () => 
{
  return crypto.randomInt(100000, 1000000);
}

export const deleteTwofas = async (fastify:FastifyInstance, userid: number) =>
{
  try
  {
    await fastify.db.run(SQLStatement.USER_DELETE_TWOFAS, userid);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const insertTwofas = async (fastify:FastifyInstance, twofa_code: number, userid: number) =>
{
  try
  {
    await fastify.db.run(SQLStatement.USER_INSERT_TWOFAS, [twofa_code, userid]);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}


export const getTwofas = async (fastify:FastifyInstance, userid: number) =>
{
  try
  {
    return await fastify.db.get<Itwofas>(SQLStatement.USER_GET_TWOFAS, userid);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const setUserTwofa = async (fastify:FastifyInstance, is_2fa_enabled: boolean, userid: number) =>
{
  try
  {
    await fastify.db.run(SQLStatement.USERSETTING_SET_TWOFAS, [is_2fa_enabled, userid]);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"DB Error"});
  }
}

export const login = async (username: string, password: string, fastify:FastifyInstance) => {
	try {
		const user = await getUserInfobyUserName(fastify, username);
  
		if (!user) {
		  return false
		}
  
		if (!user.password_hash) {
		  fastify.log.error(`User ${username} has no password hash`);
		  return false;
		}
  
		const valid = await verifyPW(user.password_hash, password);
		if (!valid) {
		  return false;
		}
		await setOnlineStatusByID(fastify, user.id, true);

      	const token = fastify.jwt.sign({ id: user.id });
		return {user, token};
	}
	catch (error) {
		fastify.log.error(`Error during login: ${error}`);
		return false;
	}
}