/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { array, Collection, isPromise, mergeObjects } from "@neocord/utils";
import { RatelimitController } from "./RatelimitController";
import { Context } from "./Context";

import type { GuildChannel, Message } from "neocord";
import type { Enjo } from "../../Client";
import type { CommandHandler } from "./CommandHandler";
import type { Command, RatelimitOptions } from "./Command";

const DEFAULTS: DispatcherOptions = {
  defaultRatelimit: "user:1/5s",
  mentionPrefix: true,
  passive: false,
  prefix: "!",
};

export class CommandDispatcher {
  /**
   * The ratelimit controller.
   * @type {RatelimitController}
   */
  public readonly ratelimit: RatelimitController;

  /**
   * The context map.
   * @type {Collection<string, Context>}
   */
  public readonly contexts: Collection<string, Context>;

  /**
   * The handler instance.
   * @type {CommandHandler}
   * @private
   */
  readonly #handler: CommandHandler;

  /**
   * The dispatcher options.
   * @type {DispatcherOptions}
   * @private
   */
  readonly #options: DispatcherOptions;

  /**
   * @param {CommandHandler} handler The command handler.
   * @param {DispatcherOptions} [options] The dispatcher options.
   */
  public constructor(handler: CommandHandler, options: DispatcherOptions = {}) {
    this.#handler = handler;
    this.#options = mergeObjects(options, DEFAULTS);

    this.ratelimit = new RatelimitController();
    this.contexts = new Collection();

    this.handle = this.handle.bind(this);

    if (!options.passive) {
      handler.client.on("messageCreate", this.handle);
      handler.client.on("messageUpdate", (o, m) => {
        if (o.content === m.content) return;
        return this.handle(m);
      });
    }
  }

  /**
   * The client instance.
   * @type {Enjo}
   */
  public get client(): Enjo {
    return this.#handler.client;
  }

  /**
   * The regexp for mention prefixes.
   * @type {RegExp}
   */
  public get mentionPrefix(): RegExp {
    return new RegExp(`^<@!?${this.client.user?.id}>\\s*`);
  }

  /**
   * The regexp for checking if the message content only contains the client mention.
   * @type {RegExp}
   */
  public get aloneMention(): RegExp {
    return new RegExp(`^\\s*<@!?${this.client.user?.id}>\\s*$`);
  }

  /**
   * Handles an updated or new message.
   * @param {Message} message The message.
   */
  public async handle(message: Message): Promise<void> {
    if (message.author.bot) return;

    // (0) Create the context.
    let ctx: Context | undefined = this.contexts.get(message.id);
    if (!ctx) {
      ctx = new Context(message);
      this.contexts.set(message.id, ctx);
    }

    // (1) Check for alone mention.
    if (this.aloneMention.test(message.content)) {
      this.#handler.emit("aloneMention", ctx);
      return;
    }

    // (2) Find the prefix.
    let prefix: string | undefined;
    if (this.mentionPrefix.test(message.content)) {
      if (!this.#options.mentionPrefix) return;
      prefix = this.mentionPrefix.exec(message.content)?.[0] as string;
    } else {
      let prefixes =
        typeof this.#options.prefix === "function"
          ? this.#options.prefix.call(this.client, ctx)
          : this.#options.prefix;

      if (!prefixes) return;
      prefixes = array(prefixes);
      prefix = prefixes.find((p) =>
        new RegExp(`^${p}\\s*`, "i").test(message.content)
      );
    }

    if (!prefix) return;

    // (3) Parse arguments.
    const [invoke, ...args] = message.content
      .slice(prefix.length)
      .trim()
      .split(/\s/g);

    const command = this.#handler.store.find((c) =>
      c.triggers.includes(invoke)
    );
    if (!command) {
      this.#handler.emit("commandNotFound", ctx, invoke);
      return;
    }

    ctx.current = { invoke, args, command };

    // (4) Run conditions.
    if (!(await this._runConditions(ctx, command))) return;
    if (!(await this._runPerms(ctx, command))) return;

    // (5) Start Typing.
    if (command.typing) {
      message.channel.typing.start().then(() => void 0);
    }

    try {
      this.#handler.emit("commandStart", ctx, command);
      let res = command.exec(ctx, {});
      if (isPromise(res)) res = await res;
      this.#handler.emit("commandFinish", ctx, command, res);
    } catch (e) {
      this.#handler.emit("commandError", ctx, e);
    } finally {
      if (command.typing) {
        message.channel.typing.stop();
      }
    }
  }

  private async _runConditions(
    ctx: Context,
    command: Command
  ): Promise<boolean> {
    if (!this.client.owners.has(ctx.author)) {
      // (0) Run Rate-limits.
      const dripRes = await this.ratelimit.drip(ctx.message, command);
      if (typeof dripRes === "number") {
        const target = RatelimitController.getRatelimitTarget(
          ctx.message,
          command.ratelimit
        );
        this.#handler.emit("ratelimited", ctx, command, dripRes, target);
        return false;
      }
    }

    // (1) Check channel type.
    if (
      (command.channel === "guild" && !ctx.guild) ||
      (command.channel === "dm" && ctx.guild)
    ) {
      this.#handler.emit(
        "commandBlocked",
        ctx,
        command,
        "channel",
        command.channel
      );
      return false;
    }

    return true;
  }

  private async _runPerms(ctx: Context, command: Command): Promise<boolean> {
    const channel = ctx.channel as GuildChannel;
    if (!this.client.owners.has(ctx.author)) {
      if (command.permissions.botOwner) {
        this.#handler.emit("commandBlocked", ctx, command, "botOwner");
        return false;
      }

      if (
        ctx.guild &&
        command.permissions.guildOwner &&
        ctx.member?.id !== ctx.guild.ownerId
      ) {
        this.#handler.emit("commandBlocked", ctx, command, "guildOwner");
        return false;
      }

      if (command.permissions.invoker) {
        if (typeof command.permissions.invoker === "function") {
          let missing = command.permissions.invoker(ctx);
          if (isPromise(missing)) missing = await missing;
          if (missing != null) {
            this.#handler.emit(
              "missingPermissions",
              ctx,
              command,
              "invoker",
              missing
            );

            return false;
          }
        } else if (ctx.guild) {
          const missing = ctx.member
            ?.permissionsIn(channel)
            .missing(command.permissions.invoker);

          if (missing?.length) {
            this.#handler.emit(
              "missingPermissions",
              ctx,
              command,
              "invoker",
              missing
            );

            return false;
          }
        }
      }
    }

    if (command.permissions.client) {
      if (typeof command.permissions.client === "function") {
        let missing = command.permissions.client(ctx);
        if (isPromise(missing)) missing = await missing;
        if (missing != null) {
          this.#handler.emit(
            "missingPermissions",
            ctx,
            command,
            "client",
            missing
          );

          return false;
        }
      } else if (ctx.guild) {
        const missing = ctx.guild.me
          .permissionsIn(channel)
          .missing(command.permissions.client);

        if (missing.length) {
          this.#handler.emit(
            "missingPermissions",
            ctx,
            command,
            "client",
            missing
          );

          return false;
        }
      }
    }

    return true;
  }
}

export type PrefixGetter = (this: Enjo, context: Context) => string | string[];

export interface DispatcherOptions {
  defaultRatelimit?: string | RatelimitOptions;
  passive?: boolean;
  mentionPrefix?: boolean;
  prefix?: (string | string[]) | PrefixGetter;
}
