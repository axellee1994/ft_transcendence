import ServerRequestError from '../../src/error/ServerRequestError';
import { IMatchStat } from '../../src/model/matchModel';
import * as matchSvc from '../../src/service/matchSvc';
import { build } from '../jeshelper'


const app = build();

// testing /api/protected/match-history route
describe("GET testing /api/protected/match-history", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/match-history";
  it("sending GET request without token", async () => {
    const res = await app.inject({
      url,
      method: 'GET'
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" })
  });

  it("sending GET request with invalid token", async () => {
    const res = await app.inject({
      url,
      method: 'GET',
      headers: {
        authorization: "Bearer invalidtoken"
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error : "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500,
    });
  });

  it("sending GET request with valid token without query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryByIDMock = jest.spyOn(matchSvc, "getMatchHistoryByID");
    getMatchHistoryByIDMock.mockResolvedValueOnce([]);
    const res = await app.inject({
      url,
      method: 'GET',
      headers: {
        authorization: "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("sending GET request with valid token with invalid query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?user_id=invalid",
      method: 'GET',
      headers: {
        authorization: "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({error: "Invalid user ID",});
  });

  it("sending GET request with valid token with valid query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryByIDMock = jest.spyOn(matchSvc, "getMatchHistoryByID");
    getMatchHistoryByIDMock.mockResolvedValueOnce([]);
    const res = await app.inject({
      url : url + "?user_id=5",
      method: 'GET',
      headers: {
        authorization: "Bearer " + jwtToken
      }
    });
    expect(getMatchHistoryByIDMock).toHaveBeenCalled();
    expect(getMatchHistoryByIDMock.mock.calls[0][1]).toEqual(5);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it("sending GET request with valid token and query but server error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryByIDMock = jest.spyOn(matchSvc, "getMatchHistoryByID");
    getMatchHistoryByIDMock.mockRejectedValueOnce(new ServerRequestError({message : "DB Error"}));
    const res = await app.inject({
      url : url + "?user_id=5",
      method: 'GET',
      headers: {
        authorization: "Bearer " + jwtToken
      }
    });
    expect(getMatchHistoryByIDMock).toHaveBeenCalled();
    expect(getMatchHistoryByIDMock.mock.calls[0][1]).toEqual(5);
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Internal Server Error' });
  });
});

// testing /api/protected/match-history/filter route
describe("GET testing /api/protected/match-history/filter", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/match-history/filter";
  
  it("sending GET request without token", async () => {
    const res = await app.inject({
      url,
      method: 'GET'
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" })
  });

  it("sending GET request with invalid token", async () => {
    const res = await app.inject({
      url,
      method: 'GET',
      headers: {authorization: "Bearer " + "invalidtoken"}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error : "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500, 
    });
  });

  it("sending GET request with valid token without query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryFilterMock = jest.spyOn(matchSvc, "getMatchHistoryFilter");
    getMatchHistoryFilterMock.mockResolvedValueOnce([]);
    const res = await app.inject({
      url,
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getMatchHistoryFilterMock).toHaveBeenCalled();
    expect(getMatchHistoryFilterMock.mock.calls[0][1]).toEqual(1);
    expect(getMatchHistoryFilterMock.mock.calls[0][2]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][3]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][4]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][5]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][6]).toEqual(20);
    expect(getMatchHistoryFilterMock.mock.calls[0][7]).toEqual(0);
    expect(res.json()).toEqual({matches: []});
  });

  it("sending GET request with valid token with invalid query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryFilterMock = jest.spyOn(matchSvc, "getMatchHistoryFilter");
    getMatchHistoryFilterMock.mockResolvedValueOnce([]);
    const res = await app.inject({
      url : url + "?result=invalid",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getMatchHistoryFilterMock).toHaveBeenCalled();
    expect(getMatchHistoryFilterMock.mock.calls[0][1]).toEqual(1);
    expect(getMatchHistoryFilterMock.mock.calls[0][2]).toEqual("invalid");
    expect(getMatchHistoryFilterMock.mock.calls[0][3]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][4]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][5]).toEqual("");
    expect(getMatchHistoryFilterMock.mock.calls[0][6]).toEqual(20);
    expect(getMatchHistoryFilterMock.mock.calls[0][7]).toEqual(0);
    expect(res.json()).toEqual({matches: []});
  });

  it("sending GET request with valid token with valid query", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryFilterMock = jest.spyOn(matchSvc, "getMatchHistoryFilter");
    getMatchHistoryFilterMock.mockResolvedValueOnce([]);
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getMatchHistoryFilterMock).toHaveBeenCalled();
    expect(getMatchHistoryFilterMock.mock.calls[0][1]).toEqual(1);
    expect(getMatchHistoryFilterMock.mock.calls[0][2]).toEqual("win");
    expect(getMatchHistoryFilterMock.mock.calls[0][3]).toEqual("single_player");
    expect(getMatchHistoryFilterMock.mock.calls[0][4]).toEqual("2023-01-01");
    expect(getMatchHistoryFilterMock.mock.calls[0][5]).toEqual("2023-12-31");
    expect(getMatchHistoryFilterMock.mock.calls[0][6]).toEqual(10);
    expect(getMatchHistoryFilterMock.mock.calls[0][7]).toEqual(0);
  });
  
  it("sending GET request with valid token and query but server error", async () => { 
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchHistoryFilterMock = jest.spyOn(matchSvc, "getMatchHistoryFilter");
    getMatchHistoryFilterMock.mockRejectedValueOnce(new ServerRequestError({message : "DB Error"}));
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error : "Internal Server Error",});
    expect(getMatchHistoryFilterMock).toHaveBeenCalled();
    expect(getMatchHistoryFilterMock.mock.calls[0][1]).toEqual(1);
    expect(getMatchHistoryFilterMock.mock.calls[0][2]).toEqual("win");
    expect(getMatchHistoryFilterMock.mock.calls[0][3]).toEqual("single_player");
    expect(getMatchHistoryFilterMock.mock.calls[0][4]).toEqual("2023-01-01");
    expect(getMatchHistoryFilterMock.mock.calls[0][5]).toEqual("2023-12-31");
    expect(getMatchHistoryFilterMock.mock.calls[0][6]).toEqual(10);
    expect(getMatchHistoryFilterMock.mock.calls[0][7]).toEqual(0);
  });

  it("sending GET request with valid token and query but invalid limit", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=-10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });

  it("sending GET request with valid token and query but invalid offset", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=-1",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });

  it("sending GET request with valid token and query but invalid limit and offset", async () => { 
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=-10&offset=-1",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });
  
  it("sending GET request with valid token and query but invalid start date", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=invalid&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });

  it("sending GET request with valid token and query but invalid end date", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=invalid&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });

  it("sending GET request with valid token and query but invalid start and end date", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=invalid&end_date=invalid&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });

  it("sending GET request with valid token and query but invalid start and end date and limit", async () => { 
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=invalid&end_date=invalid&limit=-10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });

  it("sending GET request with valid token and query but invalid start and end date and offset", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=invalid&end_date=invalid&limit=10&offset=-1",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });

it("sending GET request with valid token and query but invalid start and end date and limit and offset", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=invalid&end_date=invalid&limit=-10&offset=-1",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Limit and offset must be non-negative' });
  });

  it("sending GET request with valid token and query but limit is string", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=string&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid limit or offset' });
  }
  );

  it("sending GET request with valid token and query but offset is string", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=string",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid limit or offset' });
  });

  it("sending GET request with valid token and query but limit and offset are string", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=string&offset=string",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid limit or offset' });
  });

  it("sending GET request with valid token and query but result is invalid", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=invalid&game_type=single_player&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });

  it("sending GET request with valid token and query but game_type is invalid", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=win&game_type=invalid&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });

  it("sending GET request with valid token and query but result and game_type are invalid", async () => {  
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "?result=invalid&game_type=invalid&start_date=2023-01-01&end_date=2023-12-31&limit=10&offset=0",
      method: 'GET',
      headers: {authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({matches : [] });
  });
});

// testing /api/protected/match-history/stats route
describe("GET testing /api/protected/match-history/stats", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/match-history/stats";
  it("sending GET request without token", async () => {
    const res = await app.inject({
      url,
      method: 'GET'
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" })
  });

  it("sending GET request with invalid token", async () => {
    const res = await app.inject({
      url,
      method: 'GET',
      headers:{authorization: "Bearer " + "invalidtoken"}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error : "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500,
    });
  });

  it("sending GET request with valid token", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchStatByIDMock = jest.spyOn(matchSvc, "getMatchStatByID");
    getMatchStatByIDMock.mockResolvedValueOnce(<IMatchStat>{});
    const res = await app.inject({
      url,
      method: 'GET',
      headers:{authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getMatchStatByIDMock).toHaveBeenCalled();
    expect(getMatchStatByIDMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({});
  });

  it("sending GET request with valid token but getMatchStatBy return undefined", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const defStat : IMatchStat = {
      total_matches: 0, 
      wins: 0, 
      losses: 0, 
      draws: 0,
      single_player_matches: 0,
      multiplayer_matches: 0,
      vs_ai_matches: 0,
      vs_player_matches: 0
    }
    const getMatchStatByIDMock = jest.spyOn(matchSvc, "getMatchStatByID");
    getMatchStatByIDMock.mockResolvedValueOnce(undefined);
    const res = await app.inject({
      url,
      method: 'GET',
      headers:{authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(getMatchStatByIDMock).toHaveBeenCalled();
    expect(getMatchStatByIDMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual(defStat);
  });

  it("sending GET request with valid token but server error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getMatchStatByIDMock = jest.spyOn(matchSvc, "getMatchStatByID");
    getMatchStatByIDMock.mockRejectedValueOnce(new ServerRequestError({message : "DB Error"}));
    const res = await app.inject({
      url,
      method: 'GET',
      headers:{authorization: "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ "error": "Internal Server Error", });
  });

});

// npx jest --config ./test/jest.config.ts ./test/routes/protectedmatch-history.jest.test.ts 