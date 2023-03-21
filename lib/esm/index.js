function Init(options = { rules: [] }) {
  var _a, _b;
  options = {
    rules: options.rules,
    modernHeaders: (_a = options.modernHeaders) != null ? _a : true,
    legacyHeaders: (_b = options.legacyHeaders) != null ? _b : false
  };
  const data = {
    rules: options.rules.map((rule) => ({ ...rule, clients: {} }))
  };
  return {
    name: "rjweb-server-ratelimit",
    code: (ctr) => {
      const rules = data.rules.filter((rule) => ctr.url.path.startsWith(rule.path));
      let respond = -1;
      for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];
        if (!(ctr.client.ip in rule.clients))
          rule.clients[ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
        else if (rule.clients[ctr.client.ip].end.getTime() <= Date.now())
          rule.clients[ctr.client.ip] = { hits: 1, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + rule.timeWindow) };
        else if (rule.clients[ctr.client.ip].hits < rule.maxHits)
          rule.clients[ctr.client.ip].hits++;
        if (options.modernHeaders)
          ctr.setHeader("RateLimit-Limit", rule.maxHits).setHeader("RateLimit-Remaining", rule.maxHits - rule.clients[ctr.client.ip].hits).setHeader("RateLimit-Reset", ((rule.clients[ctr.client.ip].end.getTime() - Date.now()) / 1e3).toFixed(0)).setHeader("RateLimit-Policy", `${rule.maxHits};w=${(rule.timeWindow / 1e3).toFixed(0)}`);
        if (options.legacyHeaders)
          ctr.setHeader("X-RateLimit-Limit", rule.maxHits).setHeader("X-RateLimit-Remaining", rule.maxHits - rule.clients[ctr.client.ip].hits).setHeader("X-RateLimit-Reset", ((rule.clients[ctr.client.ip].end.getTime() - Date.now()) / 1e3).toFixed(0)).setHeader("X-RateLimit-Policy", `${rule.maxHits};w=${(rule.timeWindow / 1e3).toFixed(0)}`);
        if (rule.clients[ctr.client.ip].hits >= rule.maxHits)
          respond = index;
      }
      if (respond > -1)
        ctr.status(429).print(rules[respond].message);
      ctr.getRateLimits = () => {
        return rules.map((rule) => ({
          path: rule.path,
          hits: rule.clients[ctr.client.ip].hits,
          max: rule.maxHits,
          resetIn: rule.clients[ctr.client.ip].end.getTime() - Date.now()
        }));
      };
    }
  };
}
import { version } from "./pckg.json";
export {
  Init,
  version as Version
};
