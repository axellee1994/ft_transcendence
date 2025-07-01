import { Statement } from 'sqlite3';
import { GameStatus, GameType, IGame } from '../../src/model/gamesModel';
import * as gameSvc from '../../src/service/gameSvc'
import { build } from '../jeshelper'
import { ISqlite } from 'sqlite';

const app = build();

describe("GET Testing /api/protected/games/", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/games/";
  
  it("sending GET req without jwt", async()=>{
    const res = await app.inject({ url });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  })

  it("sending GET req with invalid jwt", async()=>{
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer 13256sdf"}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "Internal Server Error",});
  })

  it("sending GET req with valid jwt returning empty array", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGamesMock = jest.spyOn(gameSvc, "getGames");
    getGamesMock.mockImplementationOnce( async()=>[])
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  })

  it("sending GET req with valid jwt returning game array", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const dummygame:IGame[] = [
      {
        id : 2,
        player1_id: 5,
        player2_id: 6,
        winner_id: 6,
        player1_score: 5,
        player2_score: 2,
        game_type: GameType.single,
        status: GameStatus.completed,
        created_at: "string",
        updated_at: "string"
      },
      {
        id : 3,
        player1_id: 5,
        player2_id: 6,
        winner_id: 6,
        player1_score: 5,
        player2_score: 2,
        game_type: GameType.single,
        status: GameStatus.completed,
        created_at: "string",
        updated_at: "string"
      }
    ]
    const getGamesMock = jest.spyOn(gameSvc, "getGames");
    getGamesMock.mockImplementationOnce( async()=>dummygame)
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(dummygame);
  })
})


describe("POST Testing /api/protected/games/", ()=>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/games/";

  it("sending POST req without jwt", async()=>{
    const res = await app.inject({ 
      url,
      method:"POST"
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must be object",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt without body", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must be object",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with player1 id only", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{player1_id:5}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must have required property 'game_type'",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with player2 id only", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{player2_id:5}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must have required property 'player1_id'",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with player1 id only and player2_id", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{player1_id:5, player2_id:6}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must have required property 'game_type'",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with game_type only", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"5"}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must have required property 'player1_id'",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with player1_id and invalid game_type", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"hg", player1_id:5}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body/game_type must be equal to one of the allowed values",
      statusCode : 400
    });
  })

  it("sending POST req with jwt with invalid player1_id and game_type", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"single", player1_id:"fgh"}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body/player1_id must be integer",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with invalid player1_id and invalid game_type", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"sngle", player1_id:"fgh"}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body/player1_id must be integer",
      statusCode : 400,
    });
  })

  it("sending POST req with jwt with valid player1_id and valid game_type only but return invalid game", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const insertGameMock = jest.spyOn(gameSvc, "insertGame");
    insertGameMock.mockImplementationOnce(async()=>{return <ISqlite.RunResult<Statement>>{} })
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>undefined)
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"single", player1_id:5}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error : "game not created"});
  })


  it("sending POST req with jwt with valid player1_id and valid game_type return valid game", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const dummyGame:IGame = {
      id : 1,
      player1_id: 2,
      player2_id: 3,
      winner_id: 3,
      player1_score: 3,
      player2_score: 3,
      game_type: GameType.single,
      status: GameStatus.completed,
      created_at: "string",
      updated_at: "string"
    }
    const insertGameMock = jest.spyOn(gameSvc, "insertGame");
    insertGameMock.mockImplementationOnce(async()=>{return <ISqlite.RunResult<Statement>>{} })
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>dummyGame)
    const res = await app.inject({ 
      url,
      method:"POST",
      headers : {authorization : "Bearer " + jwtToken},
      body:{game_type:"single", player1_id:5}
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(dummyGame);
  })
})

describe("GET testing /api/protected/games/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/games";
  
  it("sending GET req without jwt", async()=>{
    const res = await app.inject({ 
      url : url + "/1"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  })

  it("sending GET req with invalid jwt", async()=>{
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer 13256sdf"}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "Internal Server Error",});
  });

  it("sending GET req with valid jwt but invalid id", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "/invalidid",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });

  it("sending GET req with valid jwt but game not found", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>undefined);
    const res = await app.inject({
      url : url + "/100",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(getGameByIdMock.mock.calls[0][1]).toBe(100);

    expect(res.json()).toEqual({error: "Game not found"});
  });

  it("sending GET req with valid jwt and game found", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const dummyGame:IGame = {
      id : 1,
      player1_id: 2,
      player2_id: 3,
      winner_id: 3,
      player1_score: 3,
      player2_score: 3,
      game_type: GameType.single,
      status: GameStatus.completed,
      created_at: "string",
      updated_at: "string"
    }
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>dummyGame)
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getGameByIdMock.mock.calls[0][1]).toBe(1);
    expect(res.json()).toEqual(dummyGame);
  });

  it("sending GET req with valid jwt and game found but invalid game", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>undefined)
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "Game not found"});
  });
  
  it("sending GET req with valid jwt and game found but error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>{throw new Error("error")})
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "Internal Server Error"});
  });
});

describe("PUT testing /api/protected/games/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/games";

  it("sending PUT req without jwt", async()=>{
    const res = await app.inject({ 
      url : url + "/1",
      method:"PUT"
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      error: "Bad Request",
      message: "body must be object",
      statusCode: 400,
    });
  });

  it("sending PUT req with invalid jwt without body", async()=>{
    const res = await app.inject({
      url : url + "/1",
      method:"PUT",
      headers:{"authorization": "Bearer 13256sdf"}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      error: "Bad Request",
      message: "body must be object",
      statusCode: 400,
    });
  });

  it("sending PUT req with valid jwt but invalid id without body", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "/invalidid",
      method:"PUT",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });

  it("sending PUT req with valid jwt but game not found with no body", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGameByIdMock = jest.spyOn(gameSvc, "getGameById");
    getGameByIdMock.mockImplementationOnce(async()=>undefined);
    const res = await app.inject({
      url : url + "/100",
      method:"PUT",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must be object",
      statusCode : 400,
    });
  });

});

describe("GET  testing /api/protected/games/active", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/games/active";

  it("sending GET req without jwt", async()=>{
    const res = await app.inject({ 
      url
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  });

  it("sending GET req with invalid jwt", async()=>{
    const res = await app.inject({
      url,
      headers:{"authorization": "Bearer 13256sdf"}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error : "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500,
    });
  });

  it("sending GET req with valid jwt but no active game", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getActiveGamesMock = jest.spyOn(gameSvc, "getActiveGames");
    getActiveGamesMock.mockImplementationOnce(async()=>[])
    const res = await app.inject({
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("sending GET req with valid jwt and active game", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const dummyGame:IGame = {
      id : 1,
      player1_id: 2,
      player2_id: 3,
      winner_id: 3,
      player1_score: 3,
      player2_score: 3,
      game_type: GameType.single,
      status: GameStatus.completed,
      created_at: "string",
      updated_at: "string"
    }
    const getActiveGamesMock = jest.spyOn(gameSvc, "getActiveGames");
    getActiveGamesMock.mockImplementationOnce(async()=>[dummyGame])
    const res = await app.inject({
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([dummyGame]);
  });

  it("sending GET req with valid jwt and active game but error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getActiveGamesMock = jest.spyOn(gameSvc, "getActiveGames");
    getActiveGamesMock.mockImplementationOnce(async()=>{throw new Error("error")})
    const res = await app.inject({
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "Internal Server Error"});
  });

});
// npx jest --config ./test/jest.config.ts ./test/routes/protectedgame.jest.test.ts