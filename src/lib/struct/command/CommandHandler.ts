/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { ComponentHandler, HandlerOptions } from "../Handler";
import { Command, CommandOptions } from "./Command";
import { CommandDispatcher, DispatcherOptions } from "./CommandDispatcher";

import type { Enjo } from "../../Client";
import type { Context } from "vm";

export class CommandHandler extends ComponentHandler<Command> {
  /**
   * The commands dispatcher.
   * @type {CommandDispatcher}
   */
  public readonly dispatcher: CommandDispatcher;

  /**
   * @param {Enjo} client The client instance.
   * @param {HandlerOptions} options The handler options.
   */
  public constructor(client: Enjo, options: CommandHandlerOptions = {}) {
    super(client, "commands", {
      class: Command,
      ...options,
    });

    this.dispatcher = new CommandDispatcher(this, options.dispatcher);
  }

  /**
   * Adds a new command to the store.
   * @param {CommandOptions} options The command options.
   * @param {CommandExec} exec The execution method.
   */
  public add(options: CommandOptions, exec: CommandExec): Command {
    class AddedCommand extends Command {
      constructor(client: Enjo) {
        super(client, options);

        this.exec = exec.bind(this);
      }
    }

    return this._add(new AddedCommand(this.client)) as Command;
  }
}

export type CommandExec = (
  this: Command,
  ctx: Context,
  args: Dictionary
) => unknown;

export interface CommandHandlerOptions extends HandlerOptions {
  dispatcher?: DispatcherOptions;
}
