import dotenv from "dotenv"
import Fastify from "fastify"
import appSvc from "./app"
import oauth2Plugin from "./plugins/oauth2";
import fs from 'fs'

dotenv.config()

const server = Fastify({
  logger : true,
  https:{
    key: fs.readFileSync("./pong.key"),
    cert: fs.readFileSync("./pong.crt"),
  }
});

server.register(appSvc);
server.register(oauth2Plugin);

server.listen({
  port: +(process.env.PORT || 3000),
  host : process.env.HOST || '0.0.0.0',
}, err =>{
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
});

['SIGINT', 'SIGTERM', 'SIGQUIT']
  .forEach(signal => process.on(signal, () => {
    server.close(()=>{
      console.log('Shutting down server');
    })
    process.exit();
  }));
