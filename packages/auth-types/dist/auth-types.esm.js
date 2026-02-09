var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var AuthSessionError = class extends Error {
  constructor(message, reason) {
    super(message);
    this.reason = reason;
    this.name = "AuthSessionError";
  }
  static {
    __name(this, "AuthSessionError");
  }
};
export {
  AuthSessionError
};
