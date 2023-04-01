/// <reference types="node" />
export interface RateLimitRule {
    /** The Paths to apply this Ratelimit to */ path: string | RegExp | (string | RegExp)[];
    /** The Paths to ignore when Routing This Ratelimit */ ignore?: string | RegExp | (string | RegExp)[];
    /** The Time Window in which to keep hits */ timeWindow: number;
    /** The Maximum Hits allowed in the Time Window */ maxHits: number;
}
export interface Options {
    /** HTTP Settings */ http?: {
        /**
         * The Ratelimit Rules
         * @default []
        */ rules?: RateLimitRule[];
        /**
         * The Message that gets sent when the Ratelimit is exceeded
         * @default "Ratelimited"
        */ message?: any;
    };
    /** WebSocket Message Settings */ wsMessage?: {
        /**
         * The Ratelimit Rules
         * @default []
        */ rules?: RateLimitRule[];
        /**
         * The Action that gets made when the Ratelimit is exceeded
         * @default "message"
        */ action?: 'ignore' | 'close' | 'message';
        /**
         * The Message that gets sent when the Ratelimit is exceeded & action is set to message
         * @default "Ratelimited"
        */ message?: any;
    };
    /**
     * Whether to add Modern Headers (RateLimit-*)
     * @default true
    */ modernHeaders?: boolean;
    /**
     * Whether to add Legacy Headers (X-RateLimit-*)
     * @default false
    */ legacyHeaders?: boolean;
}
export type DeepRequired<Type> = Type extends object ? Type extends Map<any, any> ? Required<Type> : Type extends Set<any> ? Required<Type> : Type extends Buffer ? Required<Type> : Type extends Function ? Required<Type> : Type extends Array<any> ? Required<Type> : Type extends {} ? {
    [Key in keyof Type]-?: DeepRequired<Type[Key]>;
} : Required<Type> : Type extends {} ? {
    [Key in keyof Type]-?: DeepRequired<Type[Key]>;
} : Required<Type>;
export default class MiddlewareOptions {
    private data;
    /** Middleware Options Helper */
    constructor(options: Options);
    private mergeOptions;
    /** Get the Resulting Options */
    getOptions(): {
        http: {
            rules: RateLimitRule[];
            message: Required<any> | {
                [x: string]: Required<any> | any | {
                    [x: string]: Required<any> | any | any;
                };
            } | {
                [x: string]: Required<any> | any | any;
            };
        };
        wsMessage: {
            rules: RateLimitRule[];
            action: "close" | "message" | "ignore";
            message: Required<any> | {
                [x: string]: Required<any> | any | {
                    [x: string]: Required<any> | any | any;
                };
            } | {
                [x: string]: Required<any> | any | any;
            };
        };
        modernHeaders: boolean;
        legacyHeaders: boolean;
    };
}
