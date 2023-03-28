import { HTTPRequestContext, MiddlewareBuilder, MiddlewareToProps, Status } from "rjweb-server"
type HTTPRequestContextFull = HTTPRequestContext & MiddlewareToProps<[ Props ]>

import MiddlewareOptions, { Options, DeepRequired } from "./classes/middlewareOptions"

export interface RemainingRateLimit {
	path: string
	hits: number
	max: number
	resetIn: number
}

interface Context {
	options: DeepRequired<Options>
	data: {
		http: {
			clients: Record<string, {
				hits: number
				start: Date
				end: Date
			}>
		}, wsMessages: {
			clients: Record<string, {
				hits: number
				start: Date
				end: Date
			}>
		}
	}
}

const { init } = new MiddlewareBuilder<Options, Context>()
	.init((lCtx, options = {}) => {
		const fullOptions = new MiddlewareOptions(options).getOptions()

		lCtx.options = fullOptions
		lCtx.data = {
			http: {
				clients: {}
			}, wsMessages: {
				clients: {}
			}
		}
	})
	.http((lCtx, stop, ctr: HTTPRequestContextFull) => {
		const rules = lCtx.options.http.rules.filter((rule) => ctr.url.path.startsWith(rule.path))

		let respond = -1
		for (let index = 0; index < rules.length; index++) {
			const rule = rules[index]

			if (!lCtx.data.http.clients[rule.path + ctr.client.ip]) lCtx.data.http.clients[rule.path + ctr.client.ip] = { hits: 1, start: new Date(), end: new Date(Date.now() + rule.timeWindow) }
			else if (lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() <= Date.now()) lCtx.data.http.clients[rule.path + ctr.client.ip] = { hits: 1, start: new Date(), end: new Date(Date.now() + rule.timeWindow) }
			else if (lCtx.data.http.clients[rule.path + ctr.client.ip].hits < rule.maxHits) lCtx.data.http.clients[rule.path + ctr.client.ip].hits++

			if (lCtx.options.modernHeaders) ctr
				.setHeader('RateLimit-Limit', rule.maxHits)
				.setHeader('RateLimit-Remaining', rule.maxHits - lCtx.data.http.clients[rule.path + ctr.client.ip].hits)
				.setHeader('RateLimit-Reset', ((lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()) / 1000).toFixed(0))
				.setHeader('RateLimit-Policy', `${rule.maxHits};w=${(rule.timeWindow / 1000).toFixed(0)}`)
			if (lCtx.options.legacyHeaders) ctr
				.setHeader('X-RateLimit-Limit', rule.maxHits)
				.setHeader('X-RateLimit-Remaining', rule.maxHits - lCtx.data.http.clients[rule.path + ctr.client.ip].hits)
				.setHeader('X-RateLimit-Reset', ((lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()) / 1000).toFixed(0))
				.setHeader('X-RateLimit-Policy', `${rule.maxHits};w=${(rule.timeWindow / 1000).toFixed(0)}`)

			if (lCtx.data.http.clients[rule.path + ctr.client.ip].hits >= rule.maxHits) respond = index
		}

		if (respond > -1) {
			ctr.status(Status.TOO_MANY_REQUESTS).print(lCtx.options.http.message)
			stop()
		}
					
		ctr.getRateLimits = () => rules.map((rule) => ({
			path: rule.path,
			hits: lCtx.data.http.clients[rule.path + ctr.client.ip].hits,
			max: rule.maxHits,
			resetIn: lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()
		}))
	})
	.wsMessage((lCtx, stop, ctr) => {
		const rules = lCtx.options.wsMessage.rules.filter((rule) => ctr.url.path.startsWith(rule.path))

		let respond = -1
		for (let index = 0; index < rules.length; index++) {
			const rule = rules[index]

			if (!lCtx.data.wsMessages.clients[rule.path + ctr.client.ip]) lCtx.data.wsMessages.clients[rule.path + ctr.client.ip] = { hits: 1, start: new Date(), end: new Date(Date.now() + rule.timeWindow) }
			else if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].end.getTime() <= Date.now()) lCtx.data.wsMessages.clients[rule.path + ctr.client.ip] = { hits: 1, start: new Date(), end: new Date(Date.now() + rule.timeWindow) }
			else if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits < rule.maxHits) lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits++

			if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits >= rule.maxHits) respond = index
		}

		if (respond > -1) {
			switch (lCtx.options.wsMessage.action) {
				case "message": {
					ctr.print(lCtx.options.wsMessage.message)
					break
				}

				case "close": {
					ctr.close(lCtx.options.wsMessage.message)
					break
				}
			}

			stop()
		}
	})
	.build()

export { init }

export interface Props {
	/** Gets the Remaining Rate Limits of the Client */ getRateLimits: () => RemainingRateLimit[]
}

/** @ts-ignore */
export { version as Version } from "./pckg.json"