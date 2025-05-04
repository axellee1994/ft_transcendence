import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'
import { FastifyInstance } from 'fastify'


// testing /api/auth route
test("Testing /api/auth", async(t) =>{
  const app: FastifyInstance = await build(t);
  
  // testing get request
  await t.test("GET /api/auth", async(t)=>{
    const res = await app.inject({
      url: '/api/auth'
    });
    assert.equal(res.statusCode, 404);
    assert.deepStrictEqual(res.json(), {
      message:"Route GET:/api/auth not found",
      error:"Not Found",
      statusCode:404
    });
  });

  await t.test("POST /api/auth", async(t)=>{
    const res = await app.inject({
      url : '/api/auth',
      method : 'POST'
    });
    assert.equal(res.statusCode, 404);
    assert.deepStrictEqual(res.json(), {
      message:"Route POST:/api/auth not found",
      error:"Not Found",
      statusCode:404
    });
  })
})

// testing /api/auth/register
test("Testing /api/auth/register", async(t) =>{
  const app: FastifyInstance = await build(t);
  
  // testing GET request
  await t.test("sending GET request", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/register"
    });
    assert.equal(res.statusCode, 404);
    assert.deepStrictEqual(res.json(),{
      message:"Route GET:/api/auth/register not found",
      error:"Not Found",
      statusCode:404
    });
  });
})

// testing /api/auth/login
test("Testing /api/auth/login", async(t) =>{
  const app: FastifyInstance = await build(t);

  // testing get
  await t.test("sending GET request", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/login"
    });
    assert.equal(res.statusCode, 404);
    assert.deepStrictEqual(res.json(),{
      message:"Route GET:/api/auth/login not found",
      error:"Not Found",
      statusCode:404
    });
  });

  //testing post with no body
  await t.test("sending POST request without body", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST'
    });
    assert.equal(res.statusCode, 400);
    assert.deepStrictEqual(res.json(),{
      code:"FST_ERR_VALIDATION",
      message:"body must be object",
      error:"Bad Request",
      statusCode:400
    })
  });
  
  //testing POST with only email
  await t.test("sending POST request with only username", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body:{username:"fgdfg"}
    });
    assert.equal(res.statusCode, 400);
    assert.deepStrictEqual(res.json(),{
      code:"FST_ERR_VALIDATION",
      message:"body must have required property 'password'",
      error:"Bad Request",
      statusCode:400
    })
  });
  
  //testing POST with only password
  await t.test("sending POST request with only password", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body:{password:"fgdfg"}
    });
    assert.equal(res.statusCode, 400);
    assert.deepStrictEqual(res.json(),{
      code:"FST_ERR_VALIDATION",
      message:"body must have required property 'username'",
      error:"Bad Request",
      statusCode:400
    })
  });
  
  //testing POST with irrelevant body
  await t.test("sending POST request with irrelevant body", async(t)=>{
    const res = await app.inject({
      url: "/api/auth/login",
      method: 'POST',
      body:{pw:"fgdfg"}
    });
    assert.equal(res.statusCode, 400);
    assert.deepStrictEqual(res.json(),{
      code:"FST_ERR_VALIDATION",
      message:"body must have required property 'username'",
      error:"Bad Request",
      statusCode:400
    })
  });
})
