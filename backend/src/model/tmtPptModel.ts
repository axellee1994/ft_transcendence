export enum EPptStatus{
  reg = 'registered',
  active = 'active',
  lost = 'eliminated',
  win = 'winner'
}

export interface ITmtPpt{
  id : number
  tournament_id : number
  user_id : number
  status : EPptStatus
  created_at : string
  updated_at : string
}
