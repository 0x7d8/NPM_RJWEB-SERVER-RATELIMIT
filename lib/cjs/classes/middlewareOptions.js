var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var middlewareOptions_exports = {};
__export(middlewareOptions_exports, {
  default: () => MiddlewareOptions
});
module.exports = __toCommonJS(middlewareOptions_exports);
class MiddlewareOptions {
  /** Middleware Options Helper */
  constructor(options) {
    this.data = this.mergeOptions({
      http: {
        rules: [],
        message: "Ratelimited"
      },
      wsMessage: {
        rules: [],
        action: "message",
        message: "Ratelimited"
      },
      modernHeaders: true,
      legacyHeaders: false
    }, options);
  }
  mergeOptions(original, user) {
    const isObject = (obj) => typeof obj === "object" && !Array.isArray(obj);
    const handleObject = (original2, user2) => {
      let output = {};
      Object.keys(original2).forEach((key) => {
        if (isObject(original2[key]) && key in user2)
          output[key] = handleObject(original2[key], user2[key]);
        else if (isObject(original2[key]))
          output[key] = original2[key];
        else if (key in user2)
          output[key] = user2[key];
        else
          output[key] = original2[key];
      });
      return output;
    };
    return handleObject(original, user);
  }
  /** Get the Resulting Options */
  getOptions() {
    return this.data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
