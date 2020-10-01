/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import type { Guild, Member, Message, TextBasedChannel, User } from "neocord";
import type { Command } from "./Command";

export class Context {
  /**
   * The message instance.
   * @type {Message}
   */
  public readonly message: Message;

  /**
   * The current invocation.
   * @type {CurrentInvocation}
   */
  public current?: CurrentInvocation;

  /**
   * @param {Message} message The message instance.
   */
  public constructor(message: Message) {
    this.message = message;
  }

  /**
   * The channel that this message was sent in.
   * @type {boolean}
   */
  public get channel(): TextBasedChannel {
    return this.message.channel;
  }

  /**
   * The command invoker.
   * @type {User}
   */
  public get author(): User {
    return this.message.author;
  }

  /**
   * The guild member that sent this message.
   * @type {?Member}
   */
  public get member(): Member | null {
    return this.message.member;
  }

  /**
   * The guild that the message was sent in.
   * @type {?Guild}
   */
  public get guild(): Guild | null {
    return this.message.guild;
  }
}

export interface CurrentInvocation {
  args: string[];
  invoke: string;
  command: Command;
}
