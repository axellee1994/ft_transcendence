export interface UserJWTPayload{
  id : number
}

export interface Ireg {
  user: {
    id: number,
    username: string,
    email: string,
    display_name: string,
    is_online: boolean,
    last_seen: string
  }
  token: string
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
  twofa_secret : string
}

export interface IuserCreated{
  id : number
  username : string
  email : string
  created_at: string,
  display_name:string,
  is_online : boolean,
  last_seen : string
}