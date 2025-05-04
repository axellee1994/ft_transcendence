export enum Estatus{
  pending = "pending",
  active = "active",
  completed = "completed",
  open = "open",
  close = "close"
}

export interface ITournament{
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: Estatus
  winner_id ?: number
  created_at: string
  updated_at: string
  max_players: number
}
