import { build } from '../jeshelper'
import * as userSvc from '../../src/service/userSvc';
import ServerRequestError from '../../src/error/ServerRequestError';
import { Ime, Iuser } from '../../src/model/userModel';

const app = build();
describe("GET testing /api/protected/auth/me", ()=>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Testing GET without jwt", async()=>{
    const res = await app.inject({
      url: "/api/protected/auth/me",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  })

  it("testing GET with invalid token", async () => {
    const res = await app.inject({
      url: "/api/protected/auth/me",
      headers: {
        "authorization": "Bearer 13256sdf"
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: "Internal Server Error",
    });
  })

  it("GET with jwt but user cannot be found", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce(async()=>undefined)
    const res = await app.inject({
      url: "/api/protected/auth/me",
      headers:{
        "authorization" : "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: 'User not found'})
  })

  it("GET with jwt but server error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce(async() => {
      throw new ServerRequestError({message:"DB Error"})
    });
    const res = await app.inject({
      url: "/api/protected/auth/me",
      headers:{
        "authorization" : "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: 'Error fetching user'})
  })


  it("GET with jwt", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(userSvc, "getUserByID");
    const userdummy = <Iuser>{
      id : 1,
      username: "string",
      email : "string",
      password_hash : "string",
      display_name : "string",
      avatar_url : "string",
      is_online : true,
      last_seen : "string",
      created_at : "string",
      updated_at : "string",
      wins : 0,
      losses : 0,
      twofa_secret : "string",
      is_2fa_enabled: false,
      is_remote_user: false
    }
    getUserByIDMock.mockImplementationOnce( async ()=>userdummy)
    const res = await app.inject({
      url: "/api/protected/auth/me",
      headers:{
        "authorization" : "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(<Ime>{
      id: userdummy.id,
      username: userdummy.username,
      email: userdummy.email,
      avatar_url: userdummy.avatar_url,
      wins: userdummy.wins,
      losses: userdummy.losses,
      is_2fa_enabled: Boolean(userdummy.is_2fa_enabled),
      display_name : userdummy.display_name,
      is_remote_user: userdummy.is_remote_user
    })
  })
})

describe("POST Testing /api/protected/logout", ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  const url = "/api/protected/auth/logout"

  it("send POST req without JWT", async()=>{
    const res = await app.inject({ 
      url,
      method:"POST"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  })

  it("send POST req with JWT but server error", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const setOnlineStatusByIDMock = jest.spyOn(userSvc, "setOnlineStatusByID");
    setOnlineStatusByIDMock.mockImplementation(async()=>{throw new ServerRequestError({message:"DB error"})});
    const res = await app.inject({
      url,
      method:"POST",
      headers:{"authorization" : "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({error: 'Server error'});
    setOnlineStatusByIDMock.mockRestore();
  })


  it("send POST req with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const setOnlineStatusByIDMock = jest.spyOn(userSvc, "setOnlineStatusByID");
    setOnlineStatusByIDMock.mockImplementationOnce(async()=>{return ;});
    const res = await app.inject({
      url,
      method : "POST",
      headers:{"authorization" : "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({message: 'Logged out successfully'});
  })
})