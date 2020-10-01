/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { CurrentShift, Janitor, Job, SweeperJobOptions } from "neocord";
import { Duration } from "@neocord/utils";

import type { CommandHandler } from "../struct/command/CommandHandler";

export const ContextJob = (options: SweeperJobOptions): typeof Job => {
  const lifetime =
    typeof options.lifetime === "string"
      ? Duration.parse(options.lifetime)
      : options.lifetime;

  return class ContextJob extends Job {
    /**
     * Whether this job can run.
     * @type {boolean}
     */
    public canRun = true;

    /**
     * @param {Janitor} janitor
     */
    public constructor(janitor: Janitor) {
      super(janitor, "context-job", options);

      if (!this.handler) {
        this.canRun = false;
        janitor.client.emit(
          "debug",
          "(Janitor) Context Job: Can't sweep anything - handler does not exist."
        );
      }

      if (lifetime <= 0) {
        this.canRun = false;
        janitor.client.emit(
          "debug",
          "(Janitor) Context Job: Can't sweep anything - lifetime is unlimited."
        );
      }
    }

    /**
     * The commands handler.
     * @type {CommandHandler}
     */
    public get handler(): CommandHandler {
      return this.janitor.client.handlers.get("commands") as CommandHandler;
    }

    /**
     * Sweeps all cached messages.
     * @param {CurrentShift} shift The current shift of this job.
     */
    public async do(shift: CurrentShift): Promise<unknown> {
      if (!this.canRun) return;

      const now = Date.now();
      const items = this.handler.dispatcher.contexts.sweep((ctx) => {
        const date =
          ctx.message.editedTimestamp ?? ctx.message.createdTimestamp;
        return now - date > lifetime;
      });

      this.janitor.client.emit(
        "debug",
        `(Janitor) Context Job: ‹Shift ${shift.id}› Swept ${items} contexts.`
      );

      return items;
    }
  };
};
