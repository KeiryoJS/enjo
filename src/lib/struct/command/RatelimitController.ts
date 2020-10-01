/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Timers } from "@neocord/utils";
import { ChannelType } from "discord-api-types";

import type { Message } from "neocord";
import type { Command, RatelimitOptions } from "./Command";

export class RatelimitController {
  /**
   * The ratelimit store.
   * @type {WeakMap}
   */
  public readonly store = new WeakMap<RatelimitKey, RatelimitEntry>();

  /**
   * Returns the ratelimit key according to the ratelimit options.
   * @param {Message} message The message.
   * @param {RatelimitOptions} options
   */
  public static getRatelimitTarget(
    message: Message,
    options: RatelimitOptions
  ): { id: string } {
    switch (options.type) {
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
    const target = RatelimitController.getRatelimitTarget(
      message,
      command.ratelimit
    ).id;

    let entry = this.store.get({ command: command.id, target });
    if (!entry) {
      entry = {
        reset: command.ratelimit.reset as number,
        remaining: Number(command.ratelimit.bucket)
      };

      entry.timeout = Timers.setTimeout(() => {
        const entry = this.store.get({ command: command.id, target });
        if (entry && entry.timeout) {
          Timers.clearTimeout(entry.timeout);
        }

        this.store.delete({ command: command.id, target });
      }, entry.reset);

      this.store.set({ target, command: command.id }, entry);
    }

    --entry.remaining;
    if (entry.remaining < 0) {
      if (entry.remaining < -1) {
        entry.reset += command.ratelimit.reset as number;
        entry.timeout?.refresh();
      }

      return entry.reset;
    }

    return true;
  }
}

export interface RatelimitEntry {
  remaining: number;
  reset: number;
  timeout?: NodeJS.Timeout;
}

export interface RatelimitKey {
  target: string;
  command: string;
}
