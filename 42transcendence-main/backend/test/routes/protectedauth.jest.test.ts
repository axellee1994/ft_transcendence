import { build } from '../jeshelper'
import * as userSvc from '../../src/service/userSvc';

const app = build();
describe("testing /api/protected/auth/me", ()=>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/protected/auth/me without jwt", async()=>{
    const res = await app.inject({
      url: "/api/protected/auth/me",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg:"unauthorized"});
  })

  it("GET /api/protected/auth/me with jwt but user cannot be found", async()=>{
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


  it("GET /api/protected/auth/me with jwt", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(userSvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce( async ()=>{
      return {
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
      }
    })
    const res = await app.inject({
      url: "/api/protected/auth/me",
      headers:{
        "authorization" : "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: 1,
      username: "string",
      email: "string",
      avatar_url: "string",
      wins: 0,
      losses: 0
    })
  })


})