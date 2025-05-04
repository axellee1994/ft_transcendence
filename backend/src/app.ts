import { join } from 'node:path';
import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';


export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
    fastify,
    opts
): Promise<void> => {

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })


  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
    options: opts,
  })

};

export default app;
export { app, options }
