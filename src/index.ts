import type { ComponentHandler } from "./lib/struct/Handler";

declare module "neocord" {
  interface Client {
    handlers: Map<string, ComponentHandler>;
  }
}
