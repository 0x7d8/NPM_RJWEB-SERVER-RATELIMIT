var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  Version: () => import_pckg.version,
  init: () => init
});
module.exports = __toCommonJS(src_exports);
var import_rjweb_server = require("rjweb-server");
var import_middlewareOptions = __toESM(require("./classes/middlewareOptions"));
var import_pckg = require("./pckg.json");
const { init } = new import_rjweb_server.MiddlewareBuilder().init((lCtx, options = {}) => {
  const fullOptions = new import_middlewareOptions.default(options).getOptions();
  lCtx.options = fullOptions;
  lCtx.data = {
    http: {
      clients: {}
    },
    wsMessages: {
      clients: {}
    }
  };
}).http((lCtx, stop, ctr) => {
  const rules = lCtx.options.http.rules.filter((rule) => ctr.url.path.startsWith(rule.path));
  let respond = -1;
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (!lCtx.data.http.clients[rule.path + ctr.client.ip])
      lCtx.data.http.clients[rule.path + ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
    else if (lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() <= Date.now())
      lCtx.data.http.clients[rule.path + ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
    else if (lCtx.data.http.clients[rule.path + ctr.client.ip].hits < rule.maxHits)
      lCtx.data.http.clients[rule.path + ctr.client.ip].hits++;
    if (lCtx.options.modernHeaders)
      ctr.setHeader("RateLimit-Limit", rule.maxHits).setHeader("RateLimit-Remaining", rule.maxHits - lCtx.data.http.clients[rule.path + ctr.client.ip].hits).setHeader("RateLimit-Reset", ((lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()) / 1e3).toFixed(0)).setHeader("RateLimit-Policy", `${rule.maxHits};w=${(rule.timeWindow / 1e3).toFixed(0)}`);
    if (lCtx.options.legacyHeaders)
      ctr.setHeader("X-RateLimit-Limit", rule.maxHits).setHeader("X-RateLimit-Remaining", rule.maxHits - lCtx.data.http.clients[rule.path + ctr.client.ip].hits).setHeader("X-RateLimit-Reset", ((lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()) / 1e3).toFixed(0)).setHeader("X-RateLimit-Policy", `${rule.maxHits};w=${(rule.timeWindow / 1e3).toFixed(0)}`);
    if (lCtx.data.http.clients[rule.path + ctr.client.ip].hits >= rule.maxHits)
      respond = index;
  }
  if (respond > -1) {
    ctr.status(import_rjweb_server.Status.TOO_MANY_REQUESTS).print(lCtx.options.http.message);
    stop();
  }
  ctr.getRateLimits = () => rules.map((rule) => ({
    path: rule.path,
    hits: lCtx.data.http.clients[rule.path + ctr.client.ip].hits,
    max: rule.maxHits,
    resetIn: lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()
  }));
}).wsMessage((lCtx, stop, ctr) => {
  const rules = lCtx.options.wsMessage.rules.filter((rule) => ctr.url.path.startsWith(rule.path));
  let respond = -1;
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (!lCtx.data.wsMessages.clients[rule.path + ctr.client.ip])
      lCtx.data.wsMessages.clients[rule.path + ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
    else if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].end.getTime() <= Date.now())
      lCtx.data.wsMessages.clients[rule.path + ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
    else if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits < rule.maxHits)
      lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits++;
    if (lCtx.data.wsMessages.clients[rule.path + ctr.client.ip].hits >= rule.maxHits)
      respond = index;
  }
  if (respond > -1) {
    switch (lCtx.options.wsMessage.action) {
      case "message": {
        ctr.print(lCtx.options.wsMessage.message);
        break;
      }
      case "close": {
        ctr.close(lCtx.options.wsMessage.message);
        break;
      }
    }
    stop();
  }
}).build();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Version,
  init
});
