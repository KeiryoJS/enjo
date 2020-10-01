/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Client, ClientOptions, User } from "neocord";
import { dirname } from "path";

import type { ComponentHandler } from "./struct/Handler";

export class Enjo extends Client {
  /**
   * All handlers that are attached to this client.
   * @type {Map<string, ComponentHandler>}
   */
  public readonly handlers: Map<string, ComponentHandler>;

  /**
   * The owners of this bot.
   * @type {string}
   */
  public owners!: ReadonlySet<User>;

  /**
   * The directory to use when loading components.
   * @type {string}
   */
  public directory: string;

  /**
   * The options provided to this client.
   */
  public options: EnjoOptions;

  /**
   * @param {EnjoOptions} [options] The options
   */
  public constructor(options: EnjoOptions = {}) {
    super(options);

    this.handlers = new Map();
    this.directory = options.directory ?? dirname(require.main?.path as string);
    this.options = options;

    this.once("ready", this._ready.bind(this));
  }

  private async _ready() {
    if (this.options.autoLoad ?? true) {
      this.emit("debug", "(Enjo) Auto loading all handlers.");
      for (const [name, handler] of this.handlers) {
        const comps = await handler.loadAll();
        this.emit(
          "debug",
          `(Enjo) Handler: ‹${name}› Loaded ${comps} Components.`
        );
      }
    }

    const owners: User[] = [];
    if (this.options.owners) {
      const arr = [...new Set(this.options.owners)] // removes duplicate ids.
        .filter((s) => typeof s === "string");

      if (arr.length) {
        const method = this.options.fetchOwners ? "fetch" : "get";

        for (const id of arr) {
          const user = await this.users[method](id);
          if (user) {
            owners.push(user);
          }
        }

        const notFetched = arr.filter((a) => owners.find((o) => o.id === a));
        if (notFetched.length) {
          this.emit(
            "debug",
            `(Enjo) Couldn't get Owners: ${notFetched.join(", ")}`
          );
        }
      }
    }

    this.owners = new Set(owners);
  }
}

export interface EnjoOptions extends ClientOptions {
  /**
   * The owners of this bot.
   * @type {Set<string> | string[]}
   */
  owners?: Set<string> | string[];

  /**
   * Whether to fetch the owners, should be 'true' if you're not caching users.
   * @type {boolean}
   */
  fetchOwners?: boolean;

  /**
   * The directory to load from.
   * @type {string}
   */
  directory?: string;

  /**
   * Whether to auto load all handlers.
   * @type {boolean}
   */
  autoLoad?: boolean;
}
