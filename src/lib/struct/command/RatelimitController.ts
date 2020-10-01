/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Fn, Timers } from "@neocord/utils";
import { ChannelType } from "discord-api-types";

import type { Message } from "neocord";
import type { Command, RatelimitType } from "./Command";

export class RatelimitController {
  /**
   * The ratelimit store.
   * @type {WeakMap}
   */
  public readonly store = new Map<string, RatelimitEntry>();

  /**
   * Returns the ratelimit key according to the ratelimit options.
   * @param {Message} message The message.
   * @param {RatelimitType} type
   */
  public static getTarget(
    message: Message,
    type: RatelimitType
  ): { id: string } {
    switch (type) {
      case "ch":
      case "channel":
        if (message.channel.type === ChannelType.DM) {
          return message.author;
        }

        return message.channel;
      case "g":
      case "guild":
        return message.guild ?? message.author;
      case "usr":
      case "user":
      default:
        return message.author;
    }
  }

  /**
   * Drip the ratelimit of a command.
   * @param {Message} message The message.
   * @param {Command} command The command.
   * @returns {Promise<number | boolean>}
   */
  public async drip(
    message: Message,
    command: Command
  ): Promise<number | true> {
    const tar = RatelimitController.getTarget(message, command.ratelimit.type)
      .id;
    const tout = this._timeout(tar, command.id);

    let entry = this.store.get(`${tar}-${command.id}`);
    if (!entry) {
      entry = {
        reset: command.ratelimit.reset,
        remaining: Number(command.ratelimit.bucket),
        timeout: Timers.setTimeout(tout, command.ratelimit.reset),
      };

      this.store.set(`${tar}-${command.id}`, entry);
    }

    if (entry.remaining === 0) {
      if (command.ratelimit.stack) {
        if (entry.exceeded) {
          if (entry.timeout) Timers.clearTimeout(entry.timeout);
          entry.reset += command.ratelimit.reset;
          entry.timeout = Timers.setTimeout(tout, entry.reset);
        }

        entry.exceeded = true;
      }

      return entry.reset;
    }

    --entry.remaining;

    return true;
  }

  private _timeout(target: string, command: string): Fn {
    return () => {
      const entry = this.store.get(`${target}-${command}`);
      if (entry && entry.timeout) {
        Timers.clearTimeout(entry.timeout);
      }

      this.store.delete(`${target}-${command}`);
    };
  }
}

export interface RatelimitEntry {
  remaining: number;
  reset: number;
  exceeded?: true;
  timeout?: NodeJS.Timeout;
}
