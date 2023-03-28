import { Options, DeepRequired } from "./classes/middlewareOptions";
export interface RemainingRateLimit {
    path: string;
    hits: number;
    max: number;
    resetIn: number;
}
interface Context {
    options: DeepRequired<Options>;
    data: {
        http: {
            clients: Record<string, {
                hits: number;
                start: Date;
                end: Date;
            }>;
        };
        wsMessages: {
            clients: Record<string, {
                hits: number;
                start: Date;
                end: Date;
            }>;
        };
    };
}
declare const init: (config?: Options) => {
    data: import("rjweb-server/lib/cjs/classes/middlewareBuilder").MiddlewareData<Options, Context>;
    config: Options;
    version: number;
    localContext: Context;
};
export { init };
export interface Props {
    /** Gets the Remaining Rate Limits of the Client */ getRateLimits: () => RemainingRateLimit[];
}
/** @ts-ignore */
export { version as Version } from "./pckg.json";
