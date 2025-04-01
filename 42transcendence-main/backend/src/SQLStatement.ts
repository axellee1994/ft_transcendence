class SQLStatement {

  // user Management
  static readonly USER_GET_ALL = 'SELECT id, username, display_name, email, avatar_url, is_online, last_seen, created_at FROM users ORDER BY created_at DESC;';
  static readonly USER_GET_ID = 'SELECT id FROM users WHERE username = ? OR email = ?;';
  static readonly USER_CREATE_USER = 
  `INSERT INTO users (username, email, password_hash, display_name, avatar_url, is_online, last_seen, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
  static readonly USER_GET_CREATED_INFO = 'SELECT id, username, email, created_at, last_seen, is_online, display_name FROM users WHERE id = ?;';
  static readonly USER_GET_INFO = 'SELECT * FROM users WHERE username = ?;';
  static readonly USER_SET_ONLINE_STATUS = 'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?;';
  static readonly USER_SEARCH = 
    `SELECT id, username, display_name, avatar_url, is_online, last_seen
     FROM users 
     WHERE (username LIKE ? OR display_name LIKE ?) AND id != ?
     ORDER BY username ASC
     LIMIT 10;`;
  static readonly USER_GET_FRIENDSHIP_STATUS = 
    `SELECT 
        status,
        CASE 
            WHEN user_id = ? THEN 'outgoing'
            WHEN friend_id = ? THEN 'incoming'
        END as direction
     FROM friendships 
     WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?);`;

  // auth
  static readonly USER_GET_BY_ID = 'SELECT * FROM users WHERE id = ?;';

  // friendship
  static readonly FRIENDSHIP_GET_FRIENDS = 
  `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_online,
        u.last_seen,
        f.status,
        f.created_at as friendship_date
    FROM friendships f
    JOIN users u ON (
        CASE
            WHEN f.user_id = ? THEN f.friend_id = u.id
            WHEN f.friend_id = ? THEN f.user_id = u.id
        END
    )
    WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    ORDER BY u.is_online DESC, u.last_seen DESC;`;
  static readonly FRIENDSHIP_GET_PENDING = 
  `SELECT 
      u.id,
      u.username,
      u.display_name,
      u.avatar_url,
      f.created_at as request_date
    FROM friendships f
    JOIN users u ON (f.user_id = u.id)
    WHERE f.friend_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC;`;
  static readonly FRIENDSHIP_GET_STATUS = 'SELECT status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?);';
  static readonly FRIENDSHIP_INSERT_REQUEST = "INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending');";
  static readonly FRIENDSHIP_GET_FRIENDS_ID_STATUS = "SELECT id, status FROM friendships WHERE user_id = ? AND friend_id = ?;";
  static readonly FRIENDSHIP_ACCEPT_FRIEND = "UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?;";
  static readonly FRIENDSHIP_DELETE_BY_ID = "DELETE FROM friendships WHERE id = ?;";
  static readonly FRIENDSHIP_UNFRIEND = "DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?);";

  // game
  static readonly GAME_GET_GAMES = "SELECT * FROM games ORDER BY created_at DESC;";
  static readonly GAME_INSERT_GAME = 
    `INSERT INTO games (player1_id, player2_id, game_type, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
  static readonly GAME_GET_GAME_BY_ID = "SELECT * FROM games WHERE id = ?;";
  static readonly GAME_UPDATE_GAME_BY_ID = "UPDATE games SET player1_score = ?, player2_score = ?, status = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;";
  static readonly GAME_UPDATE_WIN = "UPDATE users SET wins = wins + 1 WHERE id = ?;";
  static readonly GAME_UPDATE_LOSS = "UPDATE users SET losses = losses + 1 WHERE id = ?;";
  static readonly GAME_GET_ACTIVE_GAME = "SELECT * FROM games WHERE status = 'active' ORDER BY created_at DESC;";
  static readonly GAME_UPDATE_GAME_STATUS = "UPDATE games SET player1_score = ?, player2_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;";
  static readonly GAME_GET_ACTIVE_GAME_FOR_PLAYER = "SELECT * FROM games WHERE (player1_id = ? OR player2_id = ?) AND status = 'active' ORDER BY created_at DESC LIMIT 1;";
  static readonly GAME_UPDATE_COMPLETED_GAME = "UPDATE games SET status = 'completed'  WHERE id = ?;";
  static readonly GAME_INSERT_GAME_RECORD = 
    `INSERT INTO games
    (player1_id, player2_id, player1_score, player2_score, game_type, winner_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
  static readonly GAME_INSERT_PLAYER_RECORD = "INSERT INTO match_history (user_id, game_id, opponent_id, result) VALUES (?, ?, ?, ?);";
  static readonly GAME_PLAYED_WON_BY_ID = "SELECT games_played, games_won FROM user_stats WHERE user_id = ?;";
  static readonly GAME_UPDATE_USER_STAT = "UPDATE user_stats SET games_played = games_played + 1, games_won = games_won + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?;";
  static readonly GAME_CREATE_USER_STAT = "INSERT INTO user_stats (user_id, games_played, games_won, created_at, updated_at) VALUES (?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);";

  // match-history
  static readonly USER_GET_MATCH_HISTORY = 
    `SELECT 
        g.id, g.player1_id, g.player2_id, g.player1_score, g.player2_score, 
        g.winner_id, g.game_type, g.status, g.created_at, 
        p1.username as player1_username, p2.username as player2_username, 
        opp.username as opponent_username, opp.display_name as opponent_display_name, opp.avatar_url as opponent_avatar_url, 
        CASE WHEN g.winner_id = mh.user_id THEN 'win' WHEN g.winner_id IS NULL THEN 'draw' ELSE 'loss' END as result 
     FROM match_history mh 
     JOIN games g ON mh.game_id = g.id 
     LEFT JOIN users p1 ON g.player1_id = p1.id 
     LEFT JOIN users p2 ON g.player2_id = p2.id 
     LEFT JOIN users opp ON mh.opponent_id = opp.id 
     WHERE mh.user_id = ? 
     ORDER BY g.created_at DESC 
     LIMIT 10;`;

  static readonly HISTORY_MATCH_BY_ID = 
  `SELECT 
    mh.id,
    mh.result,
    mh.created_at as match_date,
    g.player1_score,
    g.player2_score,
    g.game_type,
    CASE 
        WHEN g.game_type = 'single' THEN 'AI'
        ELSE u.username 
    END as opponent_username,
    CASE 
        WHEN g.game_type = 'single' THEN 'AI'
        ELSE u.display_name 
    END as opponent_display_name,
    CASE 
        WHEN g.game_type = 'single' THEN '/assets/images/ai-avatar.png'
        ELSE u.avatar_url 
    END as opponent_avatar
    FROM match_history mh
    JOIN games g ON mh.game_id = g.id
    LEFT JOIN users u ON mh.opponent_id = u.id
    WHERE mh.user_id = ?
    ORDER BY mh.created_at DESC
    LIMIT 10;`;

  static readonly HISTORY_GET_GAME_TYPE_COUNTS = 
    `SELECT 
        g.game_type, 
        COUNT(g.game_type) as count 
     FROM match_history mh 
     JOIN games g ON mh.game_id = g.id 
     WHERE mh.user_id = ? 
     GROUP BY g.game_type;`;

  static readonly HISTORY_MATCH_STAT_BY_ID =
  `SELECT 
      COUNT(*) as total_matches,
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN g.game_type = 'single' THEN 1 ELSE 0 END) as single_player_matches,
      SUM(CASE WHEN g.game_type = 'multi' THEN 1 ELSE 0 END) as multiplayer_matches,
      SUM(CASE WHEN mh.opponent_id IS NULL THEN 1 ELSE 0 END) as vs_ai_matches,
      SUM(CASE WHEN mh.opponent_id IS NOT NULL THEN 1 ELSE 0 END) as vs_player_matches
  FROM match_history mh
  JOIN games g ON mh.game_id = g.id
  WHERE mh.user_id = ?;`;

  // user_stats
  static readonly STATS_GET_BY_USER_ID = 'SELECT * FROM user_stats WHERE user_id = ?;';
  static readonly STATS_CREATE_INITIAL = 'INSERT INTO user_stats (user_id, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);';
  static readonly STATS_UPDATE_BY_USER_ID = 
  `UPDATE user_stats 
    SET 
        games_played = ?,
        games_won = ?,
        highest_score = ?,
        fastest_win_seconds = ?,
        longest_game_seconds = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?;`;

  // tournaments
  static readonly TOURNA_GET_ALL_TOURNA = "SELECT * FROM tournaments ORDER BY created_at DESC;";
  static readonly TOURNA_GET_TOURNA_BY_ID = "SELECT * FROM tournaments WHERE id = ?;";
  static readonly TOURNA_GET_PLAYER_IN_TOURNA_BY_ID = "SELECT u.id, u.username, u.display_name, tp.status FROM tournament_participants tp JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = ?;";
  static readonly TOURNA_GET_ALL_GAME_WITH_PLAYER = 
  `SELECT 
    g.id,
    g.player1_id,
    g.player2_id,
    g.player1_score,
    g.player2_score,
    g.status,
    tm.round,
    tm.match_order as match_number,
    p1.username as player1_username,
    p2.username as player2_username
  FROM tournament_matches tm
  LEFT JOIN games g ON tm.game_id = g.id
  LEFT JOIN users p1 ON tm.player1_id = p1.id
  LEFT JOIN users p2 ON tm.player2_id = p2.id
  WHERE tm.tournament_id = ?
  ORDER BY tm.round, tm.match_order;`;
  static readonly TOURNA_INSERT_TOURNA = "INSERT INTO tournaments (name, description, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);";
  static readonly TOURNA_UPDATE_TOURNA = "UPDATE tournaments SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;";

  static readonly TOURNA_GET_PLAYER_FROM_PARTICIPANT = "SELECT user_id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?;";
  static readonly TOURNA_INSERT_PLAYER_FROM_PARTICIPANT = "INSERT INTO tournament_participants (tournament_id, user_id, status) VALUES (?, ?, ?);";
  static readonly TOURNA_DELETE_PLAYER_FROM_PARTICIPANT = "DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?;";
  static readonly TOURNA_GET_PARTICIPANT_BY_ID = "SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?;"; 
  static readonly TOURNA_INSERT_PARTICIPANT_INTO_TOURNA = "INSERT INTO tournament_participants (tournament_id, user_id, status, created_at, updated_at) VALUES (?, ?, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);";
  static readonly TOURNA_GET_TOURNA_PARTICIPANT = "SELECT * FROM tournament_participants WHERE id = ?;";
  static readonly TOURNA_GET_ALL_PLAYERS_IN_TOURNA = "SELECT u.id, u.username, u.display_name, u.avatar_url, tp.status FROM tournament_participants tp JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = ? ORDER BY tp.created_at ASC;";

  static readonly SQLSAMPLEDATA = 
  `DELETE FROM users;
  INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, is_online, last_seen, twofa_secret)
  VALUES (-1, "string1", "string2", "string3@yahoo.com.sg", "string", "string", "String", "String", "String")`

  static readonly SQLSCHEMA = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      is_online BOOLEAN DEFAULT 0,
      last_seen TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      is_2fa_enabled BOOLEAN DEFAULT 0,
      twofa_secret TEXT
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER,
      winner_id INTEGER,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      game_type TEXT NOT NULL CHECK(game_type IN ('single', 'multi', 'tournament')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      opponent_id INTEGER,
      result TEXT NOT NULL CHECK(result IN ('win', 'loss', 'draw')),
      score TEXT,
      game_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (opponent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id),
      UNIQUE(user_id, friend_id),
      CHECK(user_id != friend_id)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY NOT NULL,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      highest_score INTEGER DEFAULT 0,
      fastest_win_seconds INTEGER,
      longest_game_seconds INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
      winner_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tournament_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'registered' CHECK(status IN ('registered', 'active', 'eliminated', 'winner')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(tournament_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      winner_id INTEGER,
      game_id INTEGER,
      round INTEGER NOT NULL,
      match_order INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id),
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `

}

export default SQLStatement;