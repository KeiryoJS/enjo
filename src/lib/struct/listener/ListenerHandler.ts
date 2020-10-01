/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { mergeObjects } from "@neocord/utils";
import {
  ComponentHandler,
  ComponentResolvable,
  HandlerOptions,
} from "../Handler";
import { Listener } from "./Listener";

import type { Enjo } from "../../Client";

export class ListenerHandler extends ComponentHandler<Listener> {
  /**
   * The emitters to use when loading listeners.
   * @type {Dictionary<EventEmitterLike>}
   */
  public emitters: Dictionary<EventEmitterLike>;

  /**
   * @param {Enjo} client The client instance.
   * @param {ListenerHandlerOptions} options The listener handler options.
   */
  public constructor(client: Enjo, options: ListenerHandlerOptions) {
    super(client, "listeners", {
      class: Listener,
      ...options,
    });

    this.emitters = options.emitters ?? {
      client,
      listeners: this,
      process,
    };
  }

  /**
   * Set the emitters to use when loading listeners.
   * @param {Dictionary<EventEmitterLike>} dict The emitters dict.
   * @param {boolean} merge Whether to merge the current dict with the new one.
   * @returns {this}
   */
  public setEmitters(dict: Dictionary<EventEmitterLike>, merge = false): this {
    this.emitters = merge ? mergeObjects(this.emitters, dict) : dict;

    return this;
  }

  /**
   * Removes a listener from the store.
   * @param {ComponentResolvable} resolvable The listener to remove.
   * @param {boolean} emit Whether to emit the "removed" event.
   * @returns {?Listener}
   */
  public remove(
    resolvable: ComponentResolvable<Listener>,
    emit?: boolean
  ): Listener | null {
    const listener = super.remove(resolvable, emit);
    if (listener) listener._remove();
    return listener;
  }

  /**
   * Adds a new listener to the store.
   * @param {Listener} component The listener.
   * @param {boolean} [reload] Whether the listener was reloaded.
   * @returns {?Listener}
   */
  protected _add(component: Listener, reload?: boolean): Listener | null {
    const listener = super._add(component, reload);
    if (listener) listener._listen();
    return listener;
  }
}

export interface ListenerHandlerOptions extends HandlerOptions {
  emitters?: Dictionary<EventEmitterLike>;
}
