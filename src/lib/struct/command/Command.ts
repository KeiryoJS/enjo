/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Duration, mergeObjects } from "@neocord/utils";
import { ComponentOptions, EnjoComponent } from "../Component";

import type { PermissionResolvable } from "neocord";
import type { Context } from "./Context";
import type { Enjo } from "../../Client";

const RATELIMIT_REGEXP = /^(?:((?:ch(?:annel)?|use?r|g(?:uild)?)):)?(\d+)\/(\d+)(m?s?|h|w)(\+)?$/gim;

const RATELIMIT_DEFAULTS: Required<RatelimitOptions> = {
  reset: 5000,
  bucket: 1,
  type: "user",
  stack: true,
};

const PERMISSION_DEFAULTS: CommandPermissions = {
  botOwner: false,
  client: [],
  guildOwner: false,
  invoker: [],
};

const COMMAND_DEFAULTS = {
  typing: true,
  triggers: [],
  ratelimit: "usr:1/5s+",
  enabled: true,
  description: "No description provided.",
  permissions: PERMISSION_DEFAULTS,
  examples: [],
  usage: "",
};

export class Command extends EnjoComponent<CommandOptions> {
  /**
   * The invoke triggers.
   * @type {string[]}
   */
  public triggers: string[];

  /**
   * Whether to start typing before running this command.
   * @type {boolean}
   */
  public typing: boolean;

  /**
   * The type of channel this command can be ran in.
   * @type {ChannelType}
   */
  public channel?: ChannelType;

  /**
   * The permissions needed for this command.
   * @type {CommandPermissions}
   */
  public permissions: Required<CommandPermissions>;

  /**
   * @param {Enjo} client The client instance.
   * @param {CommandOptions} options The command options.
   */
  public constructor(client: Enjo, options: CommandOptions) {
    options = mergeObjects(options, COMMAND_DEFAULTS);
    super(client, options);

    this.triggers = options.triggers ?? [];
    this.typing = options.typing ?? true;
    this.channel = options.channel;
    this.permissions = mergeObjects(
      options.permissions ?? {},
      PERMISSION_DEFAULTS
    );
  }

  /**
   * The ratelimit options.
   * @type {RatelimitOptions}
   */
  public get ratelimit(): Required<RatelimitOptions> {
    if (typeof this.options.ratelimit === "string") {
      const r = RATELIMIT_REGEXP.exec(this.options.ratelimit);
      if (!r) return RATELIMIT_DEFAULTS;

      const [, type, bucket, reset, unit, stack] = r;
      return {
        bucket: +(bucket ?? 1),
        type: type as RatelimitType,
        reset: unit ? Duration.parse(`${reset}${unit}`) : +(reset ?? 5000),
        stack: !!stack,
      };
    }

    return mergeObjects(this.options.ratelimit ?? {}, RATELIMIT_DEFAULTS);
  }

  /**
   * Called whenever one of the triggers is invoked.
   * @param {Context} ctx The context.
   * @param {Dictionary} args Parsed arguments.
   */
  public exec(ctx: Context, args: Dictionary): unknown {
    void ctx;
    void args;
    throw new Error(`${this.constructor.name}#exec: Method not implemented.`);
  }
}

export type ExampleGetter = (prefix: string) => string[];

export type MissingPermissionResolver = (ctx: Context) => null | unknown;

export type ChannelType = "guild" | "dm";

export type RatelimitType =
  | ("ch" | "channel")
  | ("usr" | "user")
  | ("g" | "guild");

export interface RatelimitOptions {
  /**
   * Whether to stack the reset cooldown if the target is already limited.
   * @type {boolean}
   */
  readonly stack?: boolean;

  /**
   * The amount of invokes before getting limited.
   * @type {number}
   * @example
   * 2
   */
  readonly bucket?: number;

  /**
   * The amount of time before the ratelimit resets.
   * @type {number | string}
   * @example
   * "30s"
   */
  readonly reset: number;

  /**
   * The type of ratelimit.
   * Either "user", "guild", or "channel".
   * @type {RatelimitType}
   */
  readonly type?: RatelimitType;
}

export interface CommandDescription {
  /**
   * Description content.
   * @type {string}
   * @example
   * "Bans the provided member(s)"
   */
  readonly content: string;

  /**
   * Extended description content.
   * @type {string}
   * @example
   * [
   *  "Bans up to 10 members for a certain reason, you can also provide a duration.",
   *  "Example: `!ban @2D @aesthetical garbage people --duration 10m`"
   * ]
   */
  readonly extended?: string | string[];
}

export interface CommandPermissions {
  /**
   * Permissions the invoker needs to run this command.
   * @type {PermissionResolvable | MissingPermissionResolver}
   * @example
   * ["BanMembers"]
   */
  readonly invoker?: PermissionResolvable | MissingPermissionResolver;

  /**
   * Permissions the client needs for this command to be ran.
   * @type {PermissionResolvable | MissingPermissionResolver}
   * @example
   * ["BanMembers"]
   */
  readonly client?: PermissionResolvable | MissingPermissionResolver;

  /**
   * Whether the invoker has to be the bot owner to use this command.
   * @type {boolean}
   */
  readonly botOwner?: boolean;

  /**
   * Whether the invoker has to be the guild owner to use this command.
   * @type {boolean}
   */
  readonly guildOwner?: boolean;
}

export interface CommandOptions extends ComponentOptions {
  /**
   * The triggers of this command. You need at least one trigger for the command to be invokable.
   * @type {string[]}
   * @example
   * ["ping", "latency"]
   */
  readonly triggers?: string[];

  /**
   * The description of this command.
   * @type {string | CommandDescription}
   * @example
   * {
   *   content: "Bans the provided member(s)",
   *   extended: [
   *    "Bans up to 10 members for a certain reason, you can also provide a duration.",
   *    "Example: `!ban @2D @aesthetical garbage people --duration 10m`"
   *   ]
   * }
   */
  readonly description?: string | CommandDescription;

  /**
   * Example usages of this command.
   * @type {string | ExampleGetter}
   * @example
   * (prefix) => [
   *  `${prefix}help ping`
   * ]
   */
  readonly examples?: any[] | ExampleGetter;

  /**
   * The permissions that this command needs.
   * @type {CommandPermissions}
   * @example
   * {
   *   invoker: Permission.BanMembers,
   *   client: Permission.BanMembers
   * }
   */
  readonly permissions?: CommandPermissions;

  /**
   * The type of channel this command can run in.
   * @type {ChannelType}
   * @example
   * "guild"
   */
  readonly channel?: ChannelType;

  /**
   * This commands usage.
   * @type {string}
   * @example
   * "[command name]"
   */
  readonly usage?: string;

  /**
   * Whether to start typing before running the command.
   * @type {boolean}
   */
  readonly typing?: boolean;

  /**
   * The ratelimit type.
   * @type {string | RatelimitOptions}
   * @example
   * {
   *   ratelimit: "guild:4/3s",
   *   ratelimit: {
   *     bucket: 4,
   *     reset: 3e4,
   *     type: "guild"
   *   }
   * }
   */
  readonly ratelimit?: string | RatelimitOptions;
}
