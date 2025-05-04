import { build } from '../jeshelper'
import * as friendSvc from '../../src/service/friendSvc';
import * as usersvc from '../../src/service/userSvc';
import { IGetFriend, IpendingFriend } from '../../src/model/friendModel';
import { Iuser } from '../../src/model/userModel';


const app = build();
describe("GET testing /api/protected/friends/", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET without jwt", async () => {
    const res = await app.inject({
      url: "/api/protected/friends/",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });


  it("GET with jwt no friend", async () => {
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendsByIDMock = jest.spyOn(friendSvc, "getFriendsByID");
    getFriendsByIDMock.mockImplementationOnce(async () => [])
    const res = await app.inject({
      url: "/api/protected/friends/",
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });


  it("GET with jwt and friends", async () => {
    const dummyFriends: IGetFriend[] = [
      {
        id: 5,
        username: "string",
        display_name: "string",
        avatar_url: "string",
        is_online: true,
        last_seen: "string",
        status: "string",
        friendship_date: "string",
      },
      {
        id: 5,
        username: "string",
        display_name: "string",
        avatar_url: "string",
        is_online: true,
        last_seen: "string",
        status: "string",
        friendship_date: "string",
      }
    ];
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendsByIDMock = jest.spyOn(friendSvc, "getFriendsByID");
    getFriendsByIDMock.mockImplementationOnce(async () => {
      return dummyFriends;
    })
    const res = await app.inject({
      url: "/api/protected/friends/",
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(dummyFriends);
  });

})


describe("GET testing /api/protected/friends/pending", () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  const url = "/api/protected/friends/pending";

  it("GET request without jwt", async () => {
    const res = await app.inject({
      url,
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("GET request with invalid token", async () => {
    const res = await app.inject({
      url,
      headers: { "authorization": "Bearer 13256sdf" }
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      code: "FAST_JWT_MALFORMED",
      error: "Internal Server Error",
      message: "The token is malformed.",
      statusCode: 500,
    });
  });

  it("GET with valid jwt but 0 pending friends", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getPendingFriendsByIDMock = jest.spyOn(friendSvc, "getPendingFriendsByID");
    getPendingFriendsByIDMock.mockImplementationOnce(async()=>[]);
    const res = await app.inject({
      url,
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
  
  it("GET with valid jwt with pending friends", async()=>{
    const dummyPendingFriends : IpendingFriend[] = [
      {
        id : 1,
        username : "string",
        display_name : "string",
        avatar_url : "string",
        request_date : "string",
      },
      {
        id : 2,
        username : "string",
        display_name : "string",
        avatar_url : "string",
        request_date : "string",
      },
    ]
    const jwtToken = app.jwt.sign({ id: 1 });
    const getPendingFriendsByIDMock = jest.spyOn(friendSvc, "getPendingFriendsByID");
    getPendingFriendsByIDMock.mockImplementationOnce(async()=>{
      return dummyPendingFriends;
    });
    const res = await app.inject({
      url,
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(dummyPendingFriends);
  });
})


describe("POST testing /api/protected/friends/:userId", () =>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  const base = "/api/protected/friends/";

  it("POST without jwt without path variable", async()=>{
    const res = await app.inject({
      url : base,
      method:"POST"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("POST without jwt with invalid path variable s12df", async()=>{
    const res = await app.inject({
      url : base + "s12df",
      method : "POST"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("POST without jwt with valid path variable", async() => {
    const res = await app.inject({
      url : base + "12",
      method : "POST"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("POST with valid jwt but without path variable", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : base,
      method : "POST",
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "User not found"});
  });

  it("POST with valid jwt but invalid path variable fgh", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : base + "fgh",
      method : "POST",
      headers: { "authorization": "Bearer " + jwtToken }
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "User not found"});
  });

  it("POST with valid jwt and path variable but userid does not exist", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(usersvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce(async() => undefined);
    const res = await app.inject({
      url : base + "18885",
      method : "POST",
      headers: {
        "authorization": "Bearer " + jwtToken
      }
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "User not found"});
  });

  it("POST with valid jwt and path variable. userid is friend already", async() =>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(usersvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce(async() => <Iuser>{});
    const isFriendMock = jest.spyOn(friendSvc, "isFriend");
    isFriendMock.mockImplementationOnce(async() => true);
    const res = await app.inject({
      url : base + "18885",
      method : "POST",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({error: 'Friendship already exists'});
  });

  it("POST with valid jwt and path variable", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getUserByIDMock = jest.spyOn(usersvc, "getUserByID");
    getUserByIDMock.mockImplementationOnce(async() => <Iuser>{});
    const isFriendMock = jest.spyOn(friendSvc, "isFriend");
    isFriendMock.mockImplementationOnce(async() => false);
    const sendFriendReqMock = jest.spyOn(friendSvc, "sendFriendReq");
    sendFriendReqMock.mockImplementationOnce(async() => {return; });
    const res = await app.inject({
      url : base + "18885",
      method : "POST",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({message: 'Friend request sent'});
  })
})


describe("PUT testing /api/protected/friends/:userId/accept", () =>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  const base = "/api/protected/friends/";
  it("PUT with invalid path variable and without jwt", async()=>{
    const res = await app.inject({
      url : base + "sdf/accept",
      method : "PUT",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({msg: "unauthorized"})
  })

  it("PUT with invalid path variable and with jwt", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : base + "sdf/accept",
      method : "PUT",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "Friend request not found"})
  })

  it("PUT with valid path variable and with jwt but friend req not found", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>undefined)
    const res = await app.inject({
      url : base + "528/accept",
      method : "PUT",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({error: "Friend request not found"})
  })

  it("PUT with valid path variable and with jwt but friend req status is invalid", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>{return {id:5,status:'completed'}});

    const res = await app.inject({
      url : base + "528/accept",
      method : "PUT",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({error: 'Invalid friend request status'})
  })

  it("PUT with valid path variable and with jwt and valid friend req", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>{return {id:5,status:'pending'}});
    const acceptFriendReqMock = jest.spyOn(friendSvc, "acceptFriendReq");
    acceptFriendReqMock.mockImplementationOnce(async()=>{return;});
    const res = await app.inject({
      url : base + "528/accept",
      method : "PUT",
      headers: {"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({message: 'Friend request accepted'})
  })

});

describe("PUT testing /api/protected/friends/:userId/reject", ()=>{

  afterEach(() => {
    jest.clearAllMocks();
  });

  const base = "/api/protected/friends/";
  it("send valid userid without JWT", async()=>{
    const res = await app.inject({
      url : base + "555/reject",
      method:"PUT"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("send invalid userid without JWT", async()=>{
    const res = await app.inject({
      url : base + "5asd5/reject",
      method:"PUT"
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized" });
  });

  it("send invalid userid with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const res = await app.inject({
      url : base + "5asd5/reject",
      method:"PUT",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Friend request not found' });
  })

  it("send valid req but non existing friend req with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>undefined);
    const res = await app.inject({
      url : base + "55/reject",
      method:"PUT",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Friend request not found' });
  })

  it("send valid req but invalid friend req with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>{return {id:555, status:'completed'}});
    const res = await app.inject({
      url : base + "55/reject",
      method:"PUT",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid friend request status' });
  })

  it("send valid but invalid friend req with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>{return {id:555, status:'completed'}});
    const res = await app.inject({
      url : base + "55/reject",
      method:"PUT",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'Invalid friend request status' });
  })
  
  it("send valid req with JWT", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const getFriendStatusnIDMock = jest.spyOn(friendSvc, "getFriendStatusnID");
    getFriendStatusnIDMock.mockImplementationOnce(async()=>{return {id:555, status:'pending'}});
    const deleteFriendReqMock = jest.spyOn(friendSvc, "deleteFriendReq");
    deleteFriendReqMock.mockImplementationOnce(async()=>{return;});
    const res = await app.inject({
      url : base + "55/reject",
      method:"PUT",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'Friend request rejected' });
  })
})

describe("DELETE testing /api/protected/friends/:userId", ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  const base = "/api/protected/friends/";

  it("send req without path variable and no jwt", async()=>{
    const res = await app.inject({
      url : base,
      method:"DELETE",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized"  });
  });

  it("send req with invalid path variable and no jwt", async()=>{
    const res = await app.inject({
      url : base + "sd556",
      method:"DELETE",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized"  });
  });

  it("send req with valid path variable and no jwt", async()=>{
    const res = await app.inject({
      url : base + "556",
      method:"DELETE",
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ msg: "unauthorized"  });
  });

  it("send req with invalid path variable with valid jwt", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const isFriendMock = jest.spyOn(friendSvc, "isFriend");
    isFriendMock.mockImplementationOnce(async()=>false);
    const res = await app.inject({
      url : base + "5fg56",
      method:"DELETE",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({error: "bad request"});
  });

  it("send req with path variable but not friend with valid jwt ", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const isFriendMock = jest.spyOn(friendSvc, "isFriend");
    isFriendMock.mockImplementationOnce(async()=>false);
    const res = await app.inject({
      url : base + "56",
      method:"DELETE",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({error: "bad request"});
  });

  it("send req with path variable, valid friend and valid jwt", async()=>{
    const jwtToken = app.jwt.sign({ id: 1 });
    const isFriendMock = jest.spyOn(friendSvc, "isFriend");
    isFriendMock.mockImplementationOnce(async()=>true);
    const deleteFriend = jest.spyOn(friendSvc, "deleteFriend");
    deleteFriend.mockImplementationOnce(async()=>{return;});
    const res = await app.inject({
      url : base + "56",
      method:"DELETE",
      headers:{"authorization": "Bearer " + jwtToken}
    });
    expect(res.statusCode).toBe(204);
    expect(res.body.length).toBe(0);
  });
})