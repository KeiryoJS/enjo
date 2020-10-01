import { ComponentOptions, EnjoComponent } from "../Component";

import type { Enjo } from "../../Client";
import type { ListenerHandler } from "./ListenerHandler";

export class Listener extends EnjoComponent<ListenerOptions> {
  /**
   * The listener handler.
   * @type {ListenerOptions}
   */
  public handler!: ListenerHandler;

  /**
   * The event this listener is listening for.
   * @type {string}
   */
  public event: string;

  /**
   * Whether this listener can only be ran once.
   * @type {boolean}
   */
  public once: boolean;

  /**
   * @param {Enjo} client The client instance.
   * @param {ListenerOptions} options The listener options.
   */
  public constructor(client: Enjo, options: ListenerOptions) {
    super(client, options);

    this.event = options.event;
    this.once = options.once ?? false;

    this._exec = this._exec.bind(this);
  }

  /**
   * The emitter to use.
   * @type {boolean}
   */
  public get emitter(): EventEmitterLike {
    return (typeof this.options.emitter === "string"
      ? this.handler.emitters[this.options.emitter]
      : this.options.emitter) ?? this.client;
  }


  /**
   * Called whenever the provided event is emitted.
   * @param {...*} args The passed arguments.
   */
  public exec(...args: unknown[]): unknown {
    return void args;
  }

  /**
   * Enables this listener.
   * @returns {this}
   */
  public enable(): this {
    this._listen();
    return super.enable();
  }

  /**
   * Disables this listener.
   * @returns {this}
   */
  public disable(): Readonly<this> {
    this._remove();
    return super.disable();
  }


  /**
   * Removes the listener from the emitter.
   * @returns {void}
   */
  _remove(): void {
    this.emitter.removeListener(this.event, this._exec);
    return;
  }

  /**
   * Attaches the listener to the emitter.
   * @returns {void}
   */
  _listen(): void {
    const method = this.once ? "once" : "on";
    this.emitter[method](this.event, this._exec);
    return;
  }

  /**
   * Wraps Listener#exec
   * @param {...*} args
   * @private
   */
  private async _exec(...args: unknown[]): Promise<void> {
    try {
      await this.exec(...args);
    } catch (e) {
      this.handler.emit("listenerError", this, e);
    }
  }
}

export interface ListenerOptions extends ComponentOptions {
  event: string;
  emitter?: EventEmitterLike | string;
  once?: boolean;
}
