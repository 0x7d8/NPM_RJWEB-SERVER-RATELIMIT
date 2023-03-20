import { HTTPRequestContext, Middleware, MiddlewareToProps } from "rjweb-server"
type HTTPRequestContextFull = HTTPRequestContext & MiddlewareToProps<[ Props ]>

export interface Options {
	/** Rate Limit Rules */ rules: {
		/** The Path to apply this rule on */ path: string
		/** The Time Window in which to keep hits */ timeWindow: number
		/** The Maximum Hits allowed in the Time Window */ maxHits: number
		/** The Message to Respond with if Ratelimit exceeded */ message: any
	}[]

	/**
	 * Whether to add Modern Headers (RateLimit-*)
	 * @default true
	*/ modernHeaders?: boolean
	/**
	 * Whether to add Legacy Headers (X-RateLimit-*)
	 * @default false
	*/ legacyHeaders?: boolean
}

export interface RemainingRateLimit {
	path: string
	hits: number
	max: number
	resetIn: number
}

interface Data {
	rules: {
		path: string
		timeWindow: number
		maxHits: number
		message: any
		clients: Record<string, { hits: number, start: Date, end: Date }>
	}[]
}

export function Init(options: Options = { rules: [] }): Middleware {
	options = {
		rules: options.rules,
		modernHeaders: options.modernHeaders ?? true,
		legacyHeaders: options.legacyHeaders ?? false
	}

	const data: Data = {
		rules: options.rules.map((rule) => ({ ...rule, clients: {} }))
	}

	return {
		name: 'rjweb-server-ratelimit',

		code: (ctr: HTTPRequestContextFull) => {
			const rules = data.rules.filter((rule) => ctr.url.path.startsWith(rule.path))

			let respond = -1
			for (let index = 0; index < rules.length; index++) {
				const rule = rules[index]

				if (!(ctr.client.ip in rule.clients)) rule.clients[ctr.client.ip] = { hits: 1, start: new Date(), end: new Date(Date.now() + rule.timeWindow) }
				else if (rule.clients[ctr.client.ip].end.getTime() <= new Date().getTime()) rule.clients[ctr.client.ip] = { hits: 1, start: new Date(), end: new Date() }
				else rule.clients[ctr.client.ip].hits++

				if (options.modernHeaders) ctr
						.setHeader('RateLimit-Limit', rule.maxHits)
						.setHeader('RateLimit-Remaining', rule.maxHits - rule.clients[ctr.client.ip].hits)
						.setHeader('RateLimit-Reset', ((rule.clients[ctr.client.ip].end.getTime() - Date.now()) / 1000).toFixed(0))
						.setHeader('RateLimit-Policy', `${rule.maxHits};w=${(rule.timeWindow / 1000).toFixed(0)}`)
				if (options.legacyHeaders) ctr
					.setHeader('X-RateLimit-Limit', rule.maxHits)
					.setHeader('X-RateLimit-Remaining', rule.maxHits - rule.clients[ctr.client.ip].hits)
					.setHeader('X-RateLimit-Reset', ((rule.clients[ctr.client.ip].end.getTime() - Date.now()) / 1000).toFixed(0))
					.setHeader('X-RateLimit-Policy', `${rule.maxHits};w=${(rule.timeWindow / 1000).toFixed(0)}`)

				if (rule.clients[ctr.client.ip].hits >= rule.maxHits) respond = index
			}

			if (respond > -1) ctr
				.status(429)
				.print(rules[respond].message)

			ctr.getRateLimits = () => {
				return rules.map((rule) => ({
					path: rule.path,
					hits: rule.clients[ctr.client.ip].hits,
					max: rule.maxHits,
					resetIn: rule.clients[ctr.client.ip].end.getTime() - Date.now()
				}))
			}
		}
	}
}

export interface Props {
	/** Gets the Remaining Rate Limits of the Client */ getRateLimits: () => RemainingRateLimit[]
}

/** @ts-ignore */
export { version as Version } from "./pckg.json"