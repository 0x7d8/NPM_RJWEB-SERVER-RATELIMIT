import { Middleware } from "rjweb-server";
export interface Options {
    /** Rate Limit Rules */ rules: {
        /** The Path to apply this rule on */ path: string;
        /** The Time Window in which to keep hits */ timeWindow: number;
        /** The Maximum Hits allowed in the Time Window */ maxHits: number;
        /** The Message to Respond with if Ratelimit exceeded */ message: any;
    }[];
    /**
     * Whether to add Modern Headers (RateLimit-*)
     * @default true
    */ modernHeaders?: boolean;
    /**
     * Whether to add Legacy Headers (X-RateLimit-*)
     * @default false
    */ legacyHeaders?: boolean;
}
export interface RemainingRateLimit {
    path: string;
    hits: number;
    max: number;
    resetIn: number;
}
export declare function Init(options?: Options): Middleware;
export interface Props {
    /** Gets the Remaining Rate Limits of the Client */ getRateLimits: () => RemainingRateLimit[];
}
/** @ts-ignore */
export { version as Version } from "./pckg.json";
