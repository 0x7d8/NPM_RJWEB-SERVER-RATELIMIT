import { HttpRequest, MiddlewareBuilder, RequestContext, Status, WsMessage, parsePath } from "rjweb-server"
import { isRegExp } from "util/types"

import MiddlewareOptions, { Options, DeepRequired, RateLimitRule } from "./classes/middlewareOptions"

export interface RemainingRateLimit {
	path: string | RegExp | (string | RegExp)[]
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

const checkRule = (rule: RateLimitRule, ctr: RequestContext) => {
	// Check Ignore
	if (rule.ignore) if (Array.isArray(rule.ignore)) {
		let doContinue = true
		rule.ignore.forEach((ignore) => {
			if (doContinue) return

			if (isRegExp(ignore)) doContinue = !ignore.test(ctr.url.path)
			else doContinue = !ctr.url.path.includes(parsePath(ignore))
		})

		if (!doContinue) return false
	} else {
		let doContinue = true

		if (isRegExp(rule.ignore)) doContinue = !rule.ignore.test(ctr.url.path)
		else doContinue = !ctr.url.path.includes(parsePath(rule.ignore))

		if (!doContinue) return false
	}

	// Check Path
	if (Array.isArray(rule.path)) {
		let returns = false
		rule.path.forEach((path) => {
			if (isRegExp(path)) returns = path.test(ctr.url.path)
			else returns = ctr.url.path.includes(parsePath(path))
		})

		return returns
	} else {
		if (isRegExp(rule.path)) return rule.path.test(ctr.url.path)
		else return ctr.url.path.includes(parsePath(rule.path))
	}
}

class Http extends HttpRequest {
	/**
	 * Gets the remaining ratelimits
	 * @since 2.2.0
	 * @from rjweb-server-ratelimit
	*/ public getRateLimits(): RemainingRateLimit[] {
		return undefined as any
	}
}

class Ws extends WsMessage {
	/**
	 * Gets the remaining ratelimits
	 * @since 2.2.0
	 * @from rjweb-server-ratelimit
	*/ public getRateLimits(): RemainingRateLimit[] {
		return undefined as any
	}
}

export const rateLimit = new MiddlewareBuilder<Options, Context>()
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
	.httpClass(() => Http)
	.wsMessageClass(() => Ws)
	.http((lCtx, stop, ctr) => {
		const rules = lCtx.options.http.rules.filter((rule) => checkRule(rule, ctr))

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

		(ctr as Http).getRateLimits = () => rules.map((rule) => ({
			path: rule.path,
			hits: lCtx.data.http.clients[rule.path + ctr.client.ip].hits,
			max: rule.maxHits,
			resetIn: lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()
		}))
	})
	.wsMessage((lCtx, stop, ctr) => {
		const rules = lCtx.options.wsMessage.rules.filter((rule) => checkRule(rule, ctr))

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
					ctr.close(Status.TOO_MANY_REQUESTS, lCtx.options.wsMessage.message)
					break
				}
			}

			stop()
		}
	})
	.build()

/** @ts-ignore */
import { version } from "./pckg.json"
export const Version: string = version