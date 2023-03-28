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
export {
  MiddlewareOptions as default
};
