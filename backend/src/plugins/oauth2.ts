import fp from 'fastify-plugin'
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2';
import fastifyCookie from '@fastify/cookie';
import {  FastifyPluginAsync, FastifyRequest } from 'fastify';
import { AppOptions } from '../app';
import ConstantsPong from '../ConstantsPong';

declare module 'fastify' {
  interface FastifyInstance {
	googleOAuth2: OAuth2Namespace
  }
}

interface QueryString {
	state: string;
}

export const oauth2Plugin: FastifyPluginAsync<AppOptions> = async (
    fastify,
    options
): Promise<void> => {
	console.log('Registering Google OAuth2 plugin');
	fastify.register(fastifyCookie);

	fastify.register(oauthPlugin as any, {
		name: 'googleOAuth2',
		scope: ['openid', 'profile', 'email'],
		credentials: {
			client: {
				id: ConstantsPong.GOOGLE_CLIENT_ID,
				secret: ConstantsPong.GOOGLE_CLIENT_SECRET,
			},
			auth: oauthPlugin.GOOGLE_CONFIGURATION
		},
		callbackUri: ConstantsPong.GOOGLE_OAUTH2_CALLBACK_URI,
		cookie: {
			secure: true,
			sameSite: 'none'
		},
		pkce: 'S256',
		generateStateFunction: (request:FastifyRequest) => {
			const state = Math.random().toString(36).substring(2);
			request.cookies.oauth_state = state
			return state
		},
		checkStateFunction: (request: FastifyRequest<{ Querystring: QueryString }>, callback: (err?: Error) => void) => {
			if (request.query.state === request.cookies.oauth_state) {
				callback();
			} else {
				callback(new Error('Invalid state'));
			}
		}
	})
}

export const googlesignin = fp(oauth2Plugin, {
	name: 'googlesignin'
});

export default oauth2Plugin;