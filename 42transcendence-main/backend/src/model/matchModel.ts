export interface IMatchHistory{
  id : number
  result : string
  match_date : string
  player1_score : number
  player2_score : number
  game_type : string
  game_title: string
  opponent_username : string
  opponent_display_name : string
  opponent_avatar : string
}

export interface IMatchStat{
  total_matches : number
  wins: number
  losses : number
  draws : number
  single_player_matches : number
  multiplayer_matches : number
  vs_ai_matches : number
  vs_player_matches : number
}