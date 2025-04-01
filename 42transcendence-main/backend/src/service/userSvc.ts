import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import ServerRequestError from "../error/ServerRequestError";
import BadRequestError from "../error/BadRequestError";
import { Iuser, IuserCreated } from "../model/userModel";

export const isExist = async (fastify : FastifyInstance, username:string, email:string): Promise<boolean> =>{
  try{
    const result = await fastify.db.get<string>(SQLStatement.USER_GET_ID, [username, email]);
    return result?true:false;
  }
  catch(error : unknown){
    throw new ServerRequestError({message:"Server error"});
  }
}

export const createUser = async(
  fastify : FastifyInstance, 
  username : string, 
  email : string, 
  pw : string,
  displayName: string | null,
  avatarUrl: string | null
) =>{
  try{
    if (await isExist(fastify, username, email)){
      throw new BadRequestError({message:"User exist"});
    }
    const result = await fastify.db.run(SQLStatement.USER_CREATE_USER, [
      username, 
      email, 
      pw,
      displayName || username,
      avatarUrl || null,
    ]);
    const user = await fastify.db.get<IuserCreated>(SQLStatement.USER_GET_CREATED_INFO, result.lastID);
    if (user)
      return user;
    throw new BadRequestError({message:"User does not exist after creation attempt"});
  }
  catch(error:unknown){
    fastify.log.error(error, `Error during createUser for ${username}`);
    if (error instanceof BadRequestError || error instanceof ServerRequestError) {
      throw error;
    }
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
       throw new BadRequestError({ message: 'Username or email already exists' });
    }
    throw new ServerRequestError({message:"Server error during user creation"});
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

export const setOnlineStatusByID = async(fastify:FastifyInstance, userid:number, status:boolean) =>{
  try{
    await fastify.db.run(SQLStatement.USER_SET_ONLINE_STATUS, status?1:0, userid);
  }
  catch(error:unknown){
    throw new ServerRequestError({message:"Db error"});
  }
}

// Function to update non-password profile fields
export const updateUserProfile = async (
  fastify: FastifyInstance, 
  userId: number, 
  updates: { username?: string; display_name?: string; email?: string }
) => {
  // Build the SET part of the query dynamically
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (updates.username !== undefined) {
    setClauses.push('username = ?');
    params.push(updates.username);
  }
  if (updates.display_name !== undefined) {
    setClauses.push('display_name = ?');
    params.push(updates.display_name);
  }
  if (updates.email !== undefined) {
    setClauses.push('email = ?');
    params.push(updates.email);
  }

  // Only run update if there are fields to update
  if (setClauses.length > 0) {
    setClauses.push('updated_at = CURRENT_TIMESTAMP'); // Always update timestamp
    params.push(userId); // Add userId for the WHERE clause

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

    try {
      await fastify.db.run(query, params);
    } catch (error: unknown) {
      // Handle potential constraint errors (e.g., unique username/email)
      if ((error as any).code === 'SQLITE_CONSTRAINT') {
        throw new BadRequestError({ message: 'Username or email already exists' });
      }
      fastify.log.error(error, `Error updating profile for user ${userId}`);
      throw new ServerRequestError({ message: 'Database error updating profile' });
    }
  } else {
    fastify.log.info(`No profile fields to update for user ${userId}`);
  }
};

// Function to update user password
export const updateUserPassword = async (
  fastify: FastifyInstance, 
  userId: number, 
  newPasswordHash: string
) => {
  try {
    await fastify.db.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );
  } catch (error: unknown) {
    fastify.log.error(error, `Error updating password for user ${userId}`);
    throw new ServerRequestError({ message: 'Database error updating password' });
  }
};

// Function to update user avatar URL (expects base64 data URL)
export const updateUserAvatar = async (
  fastify: FastifyInstance,
  userId: number,
  avatarBase64: string
) => {
  // Basic validation: check if it looks like a data URL
  if (!avatarBase64 || !avatarBase64.startsWith('data:image/')) {
    throw new BadRequestError({ message: 'Invalid base64 avatar format. Expected data:image/...' });
  }

  try {
    await fastify.db.run(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarBase64, userId]
    );
    fastify.log.info(`Updated avatar for user ${userId}`);
  } catch (error: unknown) {
    fastify.log.error(error, `Error updating avatar for user ${userId}`);
    // Consider if specific errors need handling, e.g., field size limits
    throw new ServerRequestError({ message: 'Database error updating avatar' });
  }
};