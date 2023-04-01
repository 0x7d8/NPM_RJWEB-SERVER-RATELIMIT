import { Content } from "rjweb-server"

export interface RateLimitRule {
	/** The Paths to apply this Ratelimit to */ path: string | RegExp | (string | RegExp)[]
	/** The Paths to ignore when Routing This Ratelimit */ ignore?: string | RegExp | (string | RegExp)[]
	/** The Time Window in which to keep hits */ timeWindow: number
	/** The Maximum Hits allowed in the Time Window */ maxHits: number
}

export interface Options {
	/** HTTP Settings */ http?: {
		/**
		 * The Ratelimit Rules
		 * @default []
		*/ rules?: RateLimitRule[]
		/**
		 * The Message that gets sent when the Ratelimit is exceeded
		 * @default "Ratelimited"
		*/ message?: Content
	}

	/** WebSocket Message Settings */ wsMessage?: {
		/**
		 * The Ratelimit Rules
		 * @default []
		*/ rules?: RateLimitRule[]
		/**
		 * The Action that gets made when the Ratelimit is exceeded
		 * @default "message"
		*/ action?: 'ignore' | 'close' | 'message'
		/**
		 * The Message that gets sent when the Ratelimit is exceeded & action is set to message
		 * @default "Ratelimited"
		*/ message?: Content
	}

	/**
	 * Whether to add Modern Headers (RateLimit-*)
	 * @default true
	*/ modernHeaders?: boolean
	/**
	 * Whether to add Legacy Headers (X-RateLimit-*)
	 * @default false
	*/ legacyHeaders?: boolean
}

export type DeepRequired<Type> = Type extends object
		? Type extends Map<any, any>
			? Required<Type>
		: Type extends Set<any>
			? Required<Type> 
		: Type extends Buffer
			? Required<Type>
		: Type extends Function
			? Required<Type>
		: Type extends Array<any>
			? Required<Type>
		: Type extends {}
			? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
		: Required<Type>
	: Type extends {}
  ? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
  : Required<Type>

export default class MiddlewareOptions {
	private data: DeepRequired<Options>

	/** Middleware Options Helper */
	constructor(options: Options) {
		this.data = this.mergeOptions({
			http: {
				rules: [],
				message: 'Ratelimited'
			}, wsMessage: {
				rules: [],
				action: 'message',
				message: 'Ratelimited'
			},

			modernHeaders: true,
			legacyHeaders: false
		}, options)
	}

	private mergeOptions(original: Options, user: Options): DeepRequired<Options> {
		const isObject = (obj: any) => typeof obj === 'object' && !Array.isArray(obj)

		const handleObject = (original: Record<string, any>, user: Record<string, any>) => {
			let output: Record<string, any> = {}
			Object.keys(original).forEach((key) => {
				if (isObject(original[key]) && key in user) output[key] = handleObject(original[key], user[key])
				else if (isObject(original[key])) output[key] = original[key]
				else if (key in user) output[key] = user[key]
				else output[key] = original[key]
			})

			return output
		}

		return handleObject(original, user) as any
	}

	/** Get the Resulting Options */
	getOptions() {
		return this.data
	}
}