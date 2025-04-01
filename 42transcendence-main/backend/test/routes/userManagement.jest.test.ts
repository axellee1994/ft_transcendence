import * as userSvc from '../../src/service/userSvc';
import * as authSvc from '../../src/service/authSvc';
import { build } from '../jeshelper'

const app = build();

// testing /api/auth/register route
describe("testing /api/auth/register", () => {
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


  it("Create Account Sucessfully", async () => {
    const createUserMock = jest.spyOn(userSvc, "createUser");
    createUserMock.mockImplementationOnce(async () => {
      return {
        id: 1,
        username: "Dfg",
        email: "SDfs@42.sg",
        created_at: "sdfsd",
        display_name: "",
        is_online: true,
        last_seen: "sdfsdf"
      };
    });

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
    expect(res.statusCode).toBe(201);
    expect(res.json().user.id).toEqual("1");
    expect(res.json().user.email).toEqual("SDfs@42.sg");
    expect(res.json().user.last_seen).toEqual("sdfsdf");
  })

})

// testing /api/auth/login route
describe("testing /api/auth/login", () => {
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

  it("login with incorrect pw", async () => {
    const getUserInfoMock = jest.spyOn(userSvc, "getUserInfobyUserName");
    getUserInfoMock.mockImplementationOnce(async () => {
      return {
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
        twofa_secret: "string"
      };
    });
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
    getUserInfoMock.mockImplementationOnce(async () => {
      return {
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
        twofa_secret: "string"
      };
    });
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
    expect(res.statusCode).toBe(200);
    expect(res.json().user).toEqual({
      id: "2",
      username: "string",
      email: "string",
      display_name: "string",
      is_online: true,
      last_seen: "string"
    })
  })
})