import { build } from '../jeshelper';
import * as userStat from '../../src/service/userStatsSvc';
import { IUserStats } from '../../src/model/userStatModel';
import ServerRequestError from '../../src/error/ServerRequestError';

const app = build();

// testing /api/protected/user-stats/me route;
describe("GET Testing /api/protected/user-stats/me", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/user-stats/me";
  
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
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error: "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500,
    });
  })

  it("sending GET req with valid jwt", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "getUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>({} as IUserStats))
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(getUserStatsMock.mock.calls[0][1]).toBe(1);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
  })

  it("sending GET req with valid jwt and server error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "getUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>{throw new ServerRequestError({message : "DB Error"})});
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "DB Error"});
  })

  it("sending GET req with valid jwt and user not found", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "getUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>{throw new ServerRequestError({message : "DB Error"})});
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "DB Error"});
  })
});

// testing /api/protected/user-stats/:id route;
describe("GET Testing /api/protected/user-stats/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  const url = "/api/protected/user-stats";
  
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
    expect(res.json()).toEqual({
      code : "FAST_JWT_MALFORMED",
      error: "Internal Server Error",
      message : "The token is malformed.",
      statusCode : 500,
    });
  })
  
  it("sending GET req without path variable and jwt", async()=>{
    const res = await app.inject({url});
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      message : "Route GET:/api/protected/user-stats not found",
      statusCode : 404,
      error : "Not Found"
     });
  })

  it("sending GET req with valid jwt without path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error : "Not Found",
      message : "Route GET:/api/protected/user-stats not found",
      statusCode : 404
     });
  });

  it("sending GET req with valid jwt but invalid path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "/invalid",
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

  it("sending GET req with valid jwt and valid path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "getUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>({} as IUserStats))
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(getUserStatsMock.mock.calls[0][1]).toBe(1);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
  }
  );

  it("sending GET req with valid jwt and valid path variable but server error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "getUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>{throw new ServerRequestError({message : "DB Error"})});
    const res = await app.inject({
      url : url + "/1",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "DB Error"});
  });

});

// testing PUT /api/protected/user-stats/:userId route;
describe("PUT Testing /api/protected/user-stats/:userId", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/user-stats";
  it("sending PUT req without jwt", async()=>{
    const res = await app.inject({ 
      url : url + "/1",
      method: "PUT"
     });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must be object",
      statusCode : 400,
    });
  });


  it("sending PUT req with invalid jwt", async()=>{
    const res = await app.inject({
      url : url + "/1",
      method: "PUT",
      headers:{"authorization": "Bearer 13256sdf"}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "body must be object",
      statusCode : 400,
    });
  });


  it("sending PUT req without path variable and jwt", async()=>{
    const res = await app.inject({
      url,
      method: "PUT"
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      message : "Route PUT:/api/protected/user-stats not found",
      statusCode : 404,
      error : "Not Found"
     });
  });


  it("sending PUT req with valid jwt without path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({ 
      url,
      method: "PUT",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error : "Not Found",
      message : "Route PUT:/api/protected/user-stats not found",
      statusCode : 404
     });
  });


  it("sending PUT req with valid jwt but invalid path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : url + "/invalid",
      method: "PUT",
      headers:{"authorization": "Bearer "+jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/userId must be integer",
      statusCode : 400,
    }); 
  });

  it("sending PUT req with valid jwt and valid path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "updateUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>({} as IUserStats))
    const res = await app.inject({
      url : url + "/1",
      method: "PUT",
      headers:{"authorization": "Bearer "+jwtToken},
      payload : {
        games_played : 10,
        games_won : 5,
        highest_score : 100,
        fastest_win_seconds : 30,
        longest_game_seconds : 60
      }
    });
    expect(getUserStatsMock.mock.calls[0][1]).toBe(1);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
  });

  it("sending PUT req with valid jwt and valid path variable but server error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStat, "updateUserStats");
    getUserStatsMock.mockImplementationOnce( async()=>{throw new ServerRequestError({message : "DB Error"})});
    const res = await app.inject({
      url : url + "/1",
      method: "PUT",
      headers:{"authorization": "Bearer "+jwtToken},
      payload : {
        games_played : 10,
        games_won : 5,
        highest_score : 100,
        fastest_win_seconds : 30,
        longest_game_seconds : 60
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: "DB Error"});
  }
  );
  
  it("sending PUT req with valid jwt and valid path variable but invalid payload", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const updateUserStatsMock = jest.spyOn(userStat, "updateUserStats");
    updateUserStatsMock.mockImplementationOnce( async()=>({} as IUserStats))
    const res = await app.inject({
      url : url + "/1",
      method: "PUT",
      headers:{"authorization": "Bearer "+jwtToken},
      payload : {}
    });
    expect(updateUserStatsMock.mock.calls[0][1]).toBe(1);
    expect(updateUserStatsMock.mock.calls[0][2]).toEqual({});
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
  });


});


// npx jest --config ./test/jest.config.ts ./test/routes/protecteduser-stat.jest.test.ts 