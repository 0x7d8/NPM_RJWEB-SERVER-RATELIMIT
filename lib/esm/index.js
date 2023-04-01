import { MiddlewareBuilder, Status, pathParser } from "rjweb-server";
import { isRegExp } from "util/types";
import MiddlewareOptions from "./classes/middlewareOptions";
const checkRule = (rule, ctr) => {
  if (rule.ignore)
    if (Array.isArray(rule.ignore)) {
      let doContinue = true;
      rule.ignore.forEach((ignore) => {
        if (doContinue)
          return;
        if (isRegExp(ignore))
          doContinue = !ignore.test(ctr.url.path);
        else
          doContinue = !ctr.url.path.includes(pathParser(ignore));
      });
      if (!doContinue)
        return false;
    } else {
      let doContinue = true;
      if (isRegExp(rule.ignore))
        doContinue = !rule.ignore.test(ctr.url.path);
      else
        doContinue = !ctr.url.path.includes(pathParser(rule.ignore));
      if (!doContinue)
        return false;
    }
  if (Array.isArray(rule.path)) {
    let returns = false;
    rule.path.forEach((path) => {
      if (isRegExp(path))
        returns = path.test(ctr.url.path);
      else
        returns = ctr.url.path.includes(pathParser(path));
    });
    return returns;
  } else {
    if (isRegExp(rule.path))
      return rule.path.test(ctr.url.path);
    else
      return ctr.url.path.includes(pathParser(rule.path));
  }
};
const { init } = new MiddlewareBuilder().init((lCtx, options = {}) => {
  const fullOptions = new MiddlewareOptions(options).getOptions();
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
  const rules = lCtx.options.http.rules.filter((rule) => checkRule(rule, ctr));
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
    ctr.status(Status.TOO_MANY_REQUESTS).print(lCtx.options.http.message);
    stop();
  }
  ctr.getRateLimits = () => rules.map((rule) => ({
    path: rule.path,
    hits: lCtx.data.http.clients[rule.path + ctr.client.ip].hits,
    max: rule.maxHits,
    resetIn: lCtx.data.http.clients[rule.path + ctr.client.ip].end.getTime() - Date.now()
  }));
}).wsMessage((lCtx, stop, ctr) => {
  const rules = lCtx.options.wsMessage.rules.filter((rule) => checkRule(rule, ctr));
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
import { version } from "./pckg.json";
const Version = version;
export {
  Version,
  init
};
