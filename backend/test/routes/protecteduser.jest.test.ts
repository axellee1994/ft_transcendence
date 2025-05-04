import * as userSvc from '../../src/service/userSvc';
import * as gameSvc from '../../src/service/gameSvc';
import * as friendSvc from '../../src/service/friendSvc';
import * as userStatsSvc from '../../src/service/userStatsSvc';
import { build } from '../jeshelper'
import { Iuser, IUserOnlineStatus } from '../../src/model/userModel';
import { IUserStats } from '../../src/model/userStatModel';
import ServerRequestError from '../../src/error/ServerRequestError';

const app = build();

// testing /api/protected/users
describe("GET testing /api/protected/users", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/users";
  
  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: url,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("GET with jwt", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getAllUserMock = jest.spyOn(userSvc, "getAllUser");
    getAllUserMock.mockResolvedValue([]);
    const res = await app.inject({
      method: "GET",
      url: url,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(getAllUserMock).toHaveBeenCalled();
    expect(res.json()).toEqual([]);
  });

  it("GET with jwt and error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getAllUserMock = jest.spyOn(userSvc, "getAllUser");
    getAllUserMock.mockRejectedValue(new Error("DB Error"));
    const res = await app.inject({
      method: "GET",
      url: url,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(500);
    expect(getAllUserMock).toHaveBeenCalled();
  });
});

// testing /api/protected/users/:id
describe("GET testing /api/protected/user/:id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/users";
  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${url}/1`,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("GET with jwt", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIdMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIdMock.mockResolvedValue({} as Iuser);
    const res = await app.inject({
      method: "GET",
      url: `${url}/1`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(getUserByIdMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({});
  });

  it("GET with jwt and error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIdMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIdMock.mockRejectedValue(new Error("DB Error"));
    const res = await app.inject({
      method: "GET",
      url: `${url}/1`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(500);
    expect(getUserByIdMock).toHaveBeenCalled();
    expect(getUserByIdMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "Internal Server Error"});
  });

  it("GET with jwt and not found", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIdMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIdMock.mockResolvedValue(undefined);
    const res = await app.inject({
      method: "GET",
      url: `${url}/1`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(404);
    expect(getUserByIdMock).toHaveBeenCalled();
    expect(getUserByIdMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "User not found"});
  });

  it("GET with jwt but invalid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      method: "GET",
      url: `${url}/abc`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });
});


// testing /api/protected/users/:id/stats
describe("GET testing /api/protected/user/:id/stats", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/users";
  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/stats`,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("GET with jwt", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStatsSvc, "getUserStats");
    getUserStatsMock.mockResolvedValue({} as IUserStats);
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/stats`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(getUserStatsMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({});
  });

  it("GET with jwt and error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserStatsMock = jest.spyOn(userStatsSvc, "getUserStats");
    getUserStatsMock.mockRejectedValue(new Error("DB Error"));
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/stats`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(500);
    expect(getUserStatsMock).toHaveBeenCalled();
    expect(getUserStatsMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "Internal Server Error"});
  });


  it("Get with jwt but invalid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      method: "GET",
      url: `${url}/abc/stats`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });
});


describe("GET testing /api/protected/users/:id/matches", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/users";

  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/matches`,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("Get with jwt but invalid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      method: "GET",
      url: `${url}/abc/matches`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });

  it("Get with jwt with valid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGamesHistoryByUserIDMock = jest.spyOn(gameSvc, "getGamesHistoryByUserID");
    getGamesHistoryByUserIDMock.mockResolvedValue([]);
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/matches`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(getGamesHistoryByUserIDMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({});
  });

  it("Get with jwt and server error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getGamesHistoryByUserIDMock = jest.spyOn(gameSvc, "getGamesHistoryByUserID");
    getGamesHistoryByUserIDMock.mockRejectedValue(new ServerRequestError({message: "DB Error"})); 
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/matches`,
      headers: {authorization: `Bearer ${jwtToken}`,},
    });
    expect(res.statusCode).toEqual(500);
    expect(getGamesHistoryByUserIDMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "Internal Server Error",});
  });

});

// testing /api/protected/users/:id/friendship
describe("GET testing /api/protected/users/:id/friendship", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/users";
  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/friendship`,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("Get with jwt but invalid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      method: "GET",
      url: `${url}/abc/friendship`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });

  it("Get with jwt with valid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendshipStatusMock = jest.spyOn(friendSvc, "getFriendshipStatusByUidOrFid");
    getFriendshipStatusMock.mockResolvedValue({
      direction : null,
      status : null,
    });
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/friendship`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual({
      direction : null,
      status : null,
    });
  });
});

// testing /api/protected/users/:id/status
describe("GET testing /api/protected/users/:id/status", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const url = "/api/protected/users";
  it("Get without jwt", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/status`,
    });
    expect(res.statusCode).toEqual(401);
    expect(res.json()).toEqual({
      msg: "unauthorized",
    });
  });

  it("Get with jwt but invalid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      method: "GET",
      url: `${url}/abc/status`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(400);
    expect(res.json()).toEqual({
      code : "FST_ERR_VALIDATION",
      error : "Bad Request",
      message : "params/id must be integer",
      statusCode : 400,
    });
  });

  it("Get with jwt with valid id", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserOnlineStatusMock = jest.spyOn(userSvc, "getUserOnlineStatus");
    getUserOnlineStatusMock.mockResolvedValue(<IUserOnlineStatus>{});
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/status`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(getUserOnlineStatusMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({});
  });

  it("Get with jwt and server error", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserOnlineStatusMock = jest.spyOn(userSvc, "getUserOnlineStatus");
    getUserOnlineStatusMock.mockRejectedValue(new ServerRequestError({message: "DB Error"})); 
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/status`,
      headers: {authorization: `Bearer ${jwtToken}`,},
    });
    expect(res.statusCode).toEqual(500);
    expect(getUserOnlineStatusMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "Internal Server Error",});
  });

  it("Get with jwt and not found", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserOnlineStatusMock = jest.spyOn(userSvc, "getUserOnlineStatus");
    getUserOnlineStatusMock.mockResolvedValue(undefined);
    const res = await app.inject({
      method: "GET",
      url: `${url}/1/status`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });
    expect(res.statusCode).toEqual(404);
    expect(getUserOnlineStatusMock).toHaveBeenCalled();
    expect(getUserOnlineStatusMock.mock.calls[0][1]).toEqual(1);
    expect(res.json()).toEqual({error: "User not found"});
  });
  
 
});


//  npx jest --config ./test/jest.config.ts ./test/routes/protecteduser.jest.test.ts 