export enum GameType{
  single = "single",
  multi = "multi"
}

export enum GameStatus{
  pending = "pending",
  active = "active",
  completed = "completed"
}

export interface IGame{
  id : number
  player1_id: number,
  player2_id: number,
  winner_id: number,
  player1_score: number,
  player2_score: number,
  game_type: GameType,
  status: GameStatus,
  created_at: string,
  updated_at: string
}
