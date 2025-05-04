import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'
import { FastifyInstance } from 'fastify'

test('ping is loaded', async (t) => {
  const app: FastifyInstance = await build(t)

  const res = await app.inject({
    url: '/api/ping'
  })

  assert.deepStrictEqual(res.json(), {msg:"pong"})
})
