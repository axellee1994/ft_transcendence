import * as userSvc from '../../src/service/userSvc';
import * as authSvc from '../../src/service/authSvc';
import { build } from '../jeshelper'
import ServerRequestError from '../../src/error/ServerRequestError';
import { Ilogin, Iuser, IuserCreated } from '../../src/model/userModel';

const app = build();

// testing /api/auth/register route
describe("POST testing /api/auth/register", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sending GET request", async () => {
    const res = await app.inject({
      url: "/api/auth/register"
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      message: "Route GET:/api/auth/register not found",
      error: "Not Found",
      statusCode: 404
    });
  });

  it("Already Registered", async () => {
    const isExistMock = jest.spyOn(userSvc, "isExist");
    isExistMock.mockImplementationOnce(async () => true);
    const res = await app.inject({
      url: "/api/auth/register",
      method: "POST",
      body: {
        username: "sdfsf",
        email: "sfsdf@42.sg",
        password: "sdfsdf"
      }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "Username or email already exists" });
  });

  it("Server error", async()=>{
    const isExistMock = jest.spyOn(userSvc, "isExist");
    isExistMock.mockImplementationOnce(async () => {throw new ServerRequestError({message:"DB Error"})});
    const res = await app.inject({
      url: "/api/auth/register",
      method: "POST",
      body: {
        username: "sdfsf",
        email: "sfsdf@42.sg",
        password: "sdfsdf"
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Error creating user' });
  })


  it("Create Account Sucessfully", async () => {
    const createUserMock = jest.spyOn(userSvc, "createUser");
    const dummyUser = <IuserCreated>{
      id: 1,
      username: "Dfg",
      email: "SDfs@42.sg",
      // created_at: "sdfsd",
      display_name: "",
      is_online: true,
      last_seen: "sdfsdf",
      is_2fa_enabled: false,
      is_remote_user: false
    }
    
    createUserMock.mockImplementationOnce(async () => dummyUser);

    const res = await app.inject({
      url: "/api/auth/register",
      method: "POST",
      body: {
        username: "sdfsf",
        email: "sfsdf@42.sg",
        password: "sdfsdf"
      }
    });
    // console.log(res.json());
    expect(createUserMock.mock.calls[0][1]).toEqual("sdfsf");
    expect(createUserMock.mock.calls[0][2]).toEqual("sfsdf@42.sg");
    expect(createUserMock.mock.calls[0][3]).toEqual("sdfsdf");
    expect(res.statusCode).toBe(201);
    expect(res.json().user).toEqual(dummyUser);
  })

})

// testing /api/auth/login route
describe("POST testing /api/auth/login", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sending GET request", async () => {
    const res = await app.inject({
      url: "/api/auth/login"
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      message: "Route GET:/api/auth/login not found",
      error: "Not Found",
      statusCode: 404
    });
  });

  it("sending POST request without body", async () => {
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST'
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      message: "body must be object",
      error: "Bad Request",
      statusCode: 400
    })
  });

  it("sending POST request with only username", async () => {
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body: { username: "fgdfg" }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      message: "body must have required property 'password'",
      error: "Bad Request",
      statusCode: 400
    })
  });

  it("sending POST request with only password", async () => {
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body: { password: "fgdfg" }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      message: "body must have required property 'username'",
      error: "Bad Request",
      statusCode: 400
    })
  });

  it("sending POST request with irrelevant body", async () => {
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body: { pw: "fgdfg" }
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      code: "FST_ERR_VALIDATION",
      message: "body must have required property 'username'",
      error: "Bad Request",
      statusCode: 400
    })
  });

  it("login with wrong detail", async () => {
    const res = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      body: {
        username: "sdfsf",
        password: "sdfsdf"
      }
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'Username not found. Please check your credentials.' })
  });

  it("login but Server error", async()=>{
    const getUserInfoMock = jest.spyOn(userSvc, "getUserInfobyUserName");
    getUserInfoMock.mockImplementationOnce(async()=>{throw new ServerRequestError({message:"DB Error"})});
    const res = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      body: {
        username: "sdfsf",
        password: "sdfsdf"
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: 'Server error during login. Please try again later.' })
  })

  it("login with incorrect pw", async () => {
    const getUserInfoMock = jest.spyOn(userSvc, "getUserInfobyUserName");
    const dummyUserInfo = <Iuser>{
      id: 2,
      username: "string",
      email: "string",
      password_hash: "string",
      display_name: "string",
      avatar_url: "string",
      is_online: true,
      last_seen: "string",
      created_at: "string",
      updated_at: "string",
      wins: 0,
      losses: 0,
      twofa_secret: "string",
      is_2fa_enabled: false,
      is_remote_user:false
    }
    getUserInfoMock.mockImplementationOnce(async () => dummyUserInfo);
    const verifyPWMock = jest.spyOn(authSvc, "verifyPW");
    verifyPWMock.mockImplementationOnce(async () => false);
    const res = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      body: {
        username: "sdfsf",
        password: "sdfsdf"
      }
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'Incorrect password. Please try again.' })
  })

  it("login with correct pw", async () => {
    const getUserInfoMock = jest.spyOn(userSvc, "getUserInfobyUserName");
    const dummyUserInfo = <Iuser>{
      id: 2,
      username: "string",
      email: "string",
      password_hash: "string",
      display_name: "string",
      avatar_url: "string",
      is_online: true,
      last_seen: "string",
      created_at: "string",
      updated_at: "string",
      wins: 0,
      losses: 0,
      twofa_secret: "string",
      is_2fa_enabled: false,
      is_remote_user: false
    }
    getUserInfoMock.mockImplementationOnce(async () => dummyUserInfo);
    const verifyPWMock = jest.spyOn(authSvc, "verifyPW");
    verifyPWMock.mockImplementationOnce(async () => true);
    const res = await app.inject({
      url: "/api/auth/login",
      method: "POST",
      body: {
        username: "sdfsf",
        password: "sdfsdf"
      }
    });
    expect(verifyPWMock.mock.calls[0][1]).toEqual("sdfsdf");
    expect(res.statusCode).toBe(200);
    expect(res.json().user).toEqual(<Ilogin>{
      id : dummyUserInfo.id,
      username : dummyUserInfo.username,
      email : dummyUserInfo.email,
      avatar_url :dummyUserInfo.avatar_url,
      display_name : dummyUserInfo.display_name,
      is_online : dummyUserInfo.is_online,
      last_seen : dummyUserInfo.last_seen,
      is_2fa_enabled : dummyUserInfo.is_2fa_enabled,
      is_remote_user : dummyUserInfo.is_remote_user
    })
  })
})