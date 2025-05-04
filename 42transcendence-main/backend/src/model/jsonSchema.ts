export const errSchema = {
    type: 'object',
    properties:{
      error : {type:'string'}
    }
}

export const okSchema = {
  type: 'object',
  properties:{
    message: {type : 'string'}
  }
}

export const regBodySchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: ['integer', 'null'] },
        username: { type: ['string', 'null']},
        email: { type: ['string', 'null']},
        display_name: { type: ['string', 'null']},
        is_online: { type: ['boolean', 'null'] },
        last_seen: { type: ['string', 'null']},
        is_2fa_enabled: {type: ['boolean', 'null']},
        avatar_url: { type : ['string', 'null'] },
        is_remote_user: {type: ['boolean', 'null']},
      }
    },
    token: { type: ['string', 'null'] }
  }
}

export const loginBodySchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: ['integer', 'null'] },
        username: { type: ['string', 'null']},
        email: { type: ['string', 'null']},
        avatar_url: { type : ['string', 'null'] },
        display_name: { type: ['string', 'null']},
        is_online: { type: ['boolean', 'null'] },
        last_seen: { type: ['string', 'null']},
        is_2fa_enabled: {type: ['boolean', 'null']},
        is_remote_user: {type: ['boolean', 'null']}
      }
    },
    token: { type: ['string', 'null'] }
  }
}

export const meSchema = {
  type : 'object',
  properties : {
    id : {type: 'integer'},
    username : {type : 'string'},
    email : {type:'string'},
    avatar_url: {type : 'string'},
    wins : {type: 'integer'},
    losses : {type : 'integer'},
    is_2fa_enabled : {type : 'boolean'},
    display_name : {type : 'string'},
    is_remote_user : {type : 'boolean'}
  }
}


export const gameSchema = {
  type: 'object',
  properties: {
      id: { type: 'integer' },
      player1_id: { type: 'integer' },
      player2_id: { type: 'integer' },
      winner_id: { type: 'integer' },
      player1_score: { type: 'integer' },
      player2_score: { type: 'integer' },
      game_type: { type: 'string', enum: ['single', 'multi'] },
      status: { type: 'string', enum: ['pending', 'active', 'completed'] },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
  }
};



export const leaderboardSchema = {
  type: 'array',
  items: {
      type: 'object',
      properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          wins: { type: 'integer' },
          losses: { type: 'integer' },
          winRate: { type: 'number' },
          totalGames: { type: 'integer' },
          rank: { type: 'integer' }
      }
  }
};

export const tournamentSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string' },
    start_date: { type: 'string', format: 'date-time' },
    end_date: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['pending', 'active', 'completed'] },
    winner_id: { type: ['integer', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    max_players: { type: 'number' }
  }
};

export const participantSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    tournament_id: { type: 'integer' },
    user_id: { type: 'integer' },
    status: { type: 'string', enum: ['registered', 'active', 'eliminated'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
};

export const userStatsSchema = {
  type: 'object',
  properties: {
      user_id: { type: 'integer' },
      games_played: { type: 'integer' },
      games_won: { type: 'integer' },
      highest_score: { type: 'integer' },
      fastest_win_seconds: { type: ['integer', 'null'] },
      longest_game_seconds: { type: ['integer', 'null'] },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      win_rate: { type: 'number' }
  }
};

export const userSchema = {
  type: 'object',
  properties: {
      id: { type: 'integer' },
      username: { type: 'string' },
      email: { type: 'string', format: 'email' },
      display_name: {type:'string'},
      avatar_url: { type: 'string' },
      wins: { type: 'integer' },
      losses: { type: 'integer' },
      is_online: { type: 'boolean' },
      last_seen: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      is_2fa_enabled: { type: 'boolean'},
      is_remote_user: { type: 'boolean'}
  }
};

export const userOnlineStatusSchema = {
  type : 'object',
  properties :{
    id : {type: 'number'},
    username : {type : 'string'},
    is_online : {type : 'string'},
    last_seen : {type : 'string'},
  }
}


export const userOnlineStatusByUsernameOrDisplayNameSchema = {
  type : 'object',
  properties :{
    ...userOnlineStatusSchema.properties,
    display_name : {type : 'string'},
    avatar_url : {type : 'string'}
  }
}