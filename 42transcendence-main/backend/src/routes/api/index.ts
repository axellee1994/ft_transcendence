import { FastifyPluginAsync } from "fastify"
import userManagement from "./userManagement"

const routeIndex: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

  // sub route
  void fastify.register(userManagement, {
    prefix : "/auth"
  })

  // heartbeat
  fastify.get<{ Reply : {msg:string} }>('/ping', async function (request, reply) {
    return {msg:"pong"};
  })

}

export default routeIndex;
