/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Base } from "neocord";
import { join } from "path";

import type { Enjo } from "../Client";
import type { ComponentHandler } from "./Handler";

export class EnjoComponent<O extends ComponentOptions = ComponentOptions> extends Base {
  /**
   * The options for this component
   * @type {ComponentOptions}
   */
  public readonly options: O;

  /**
   * The ID of this component.
   * @type {string}
   */
  public id!: string;

  /**
   * Whether this component is enabled.
   * @type {boolean}
   */
  public enabled: boolean;

  /**
   * The handler that loaded this component.
   * @type {ComponentHandler}
   */
  public handler!: ComponentHandler<EnjoComponent>;

  /**
   * The path to this file.
   * @type {string}
   */
  public path!: string;

  /**
   * @param {Enjo} client The client instance.
   * @param {ComponentOptions} options The component options.
   */
  public constructor(client: Enjo, options: O) {
    super(client);

    if (options.id)
      this.id = options.id;

    this.options = options;

    this.enabled = options.enabled ?? false;
  }

  /**
   * Ran when the client has become ready.
   */
  public init(): unknown {
    return;
  }

  /**
   * Disables this component.
   * @returns {Readonly<this>}
   */
  public disable(): Readonly<this> {
    if (this.enabled) {
      this.enabled = false;
      this.handler.emit("disabled", this);
    }

    return this._freeze();
  }

  /**
   * Enables this component.
   * @returns {this}
   */
  public enable(): this {
    if (!this.enabled) {
      this.enabled = true;
      this.handler.emit("enabled", this);
    }

    return this;
  }

  /**
   * Update this component.
   * @param {Dictionary} data
   */
  _patch(data: Dictionary): this {
    if (!this.id) {
      this.id = data.file[data.file.length - 1];
    }

    this.handler = data.handler;
    this.path = join(data.dir, ...data.file);

    return this;
  }
}

export interface ComponentOptions {
  id?: string;
  enabled?: boolean;
}
