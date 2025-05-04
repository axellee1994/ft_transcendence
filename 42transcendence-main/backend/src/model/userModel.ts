export interface UserJWTPayload{
  id : number
}

export interface Ireg {
  user?: {
    id?: number,
    username?: string,
    email?: string,
    display_name?: string,
    is_online?: boolean,
    last_seen?: string,
    is_2fa_enabled?: boolean,
    avatar_url? : string,
    is_remote_user?: boolean
  }
  token?: string
}

export interface Ilogin{
  user?: {
    id?: number,
    username?: string,
    email?: string,
    avatar_url?:string,
    display_name?: string,
    is_online?: boolean,
    last_seen?: string,
    is_2fa_enabled?: boolean,
    is_remote_user?: boolean
  }
  token?: string
}


export interface IuserStats{
  id : number, 
  user_id : number,
  games_played : number,
  games_won : number,
  highest_score : number
  fastest_win_seconds ?: number
  longest_game_seconds ?: number
  created_at : string
  updated_at : string 
  win_rate : number
}

export interface Ime{
  id : number
  username : string
  email: string
  avatar_url: string
  wins: number
  losses: number
  is_2fa_enabled: boolean
  display_name : string
  is_remote_user: boolean
}

export interface Iuser{
  id : number
  username: string
  email : string
  password_hash : string
  display_name : string
  avatar_url : string
  is_online : boolean
  last_seen : string
  created_at : string
  updated_at : string
  wins : number
  losses : number
  is_2fa_enabled: boolean
  is_remote_user : boolean
}

export interface IuserCreated{
  id : number
  username : string
  email : string
  created_at: string,
  display_name:string,
  is_online : boolean,
  last_seen : string,
  is_2fa_enabled: boolean,
  is_remote_user: boolean
}

export interface Itwofas{
  id: number
  code: number
  user_id: number
  expired_at: string
  created_at : string
}

export interface IUserOnlineStatus{
  id : number
  username : string
  is_online : string
  last_seen : string
}

export interface IUserSearchOnlineStatus extends IUserOnlineStatus{
  display_name : string
  avatar_url : string
}

export interface GoogleUserInfo {
	email: string;
	name: string;
}