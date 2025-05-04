import fp from 'fastify-plugin'
import jwtSvc, { FastifyJWTOptions } from '@fastify/jwt'
import ConstantsPong from '../ConstantsPong'


export default fp<FastifyJWTOptions>(async (fastify) => {
  fastify.register(jwtSvc, {
    secret: ConstantsPong.JWT_SECRET,
  })
})
