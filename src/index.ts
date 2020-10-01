import type { ComponentHandler } from "./lib/struct/Handler";

export * from "./lib/struct/command/Command";
export * from "./lib/struct/command/CommandHandler";
export * from "./lib/struct/command/CommandDispatcher";
export * from "./lib/struct/command/RatelimitController";
export * from "./lib/struct/command/Context";

export * from "./lib/struct/listener/Listener";
export * from "./lib/struct/listener/ListenerHandler";

export * from "./lib/struct/Handler";
export * from "./lib/struct/Component";

export * from "./lib/util/ContextJob";

export * from "./lib/Client";

declare module "neocord" {
  interface Client {
    handlers: Map<string, ComponentHandler>;
  }
}
