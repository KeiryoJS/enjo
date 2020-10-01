/*
 * Copyright (c) 2020. MeLike2D All Rights Reserved.
 * Neo is licensed under the MIT License.
 * See the LICENSE file in the project root for more details.
 */

import { Class, Collection, Emitter, isClass, walk } from "@neocord/utils";
import { EnjoComponent } from "./Component";
import { join, relative, sep } from "path";
import { lstatSync, Stats } from "fs";

import type { Enjo } from "../Client";
import type { BaseResolvable } from "neocord";

export class ComponentHandler<
  T extends EnjoComponent = EnjoComponent
> extends Emitter {
  /**
   * The components that were loaded by this handler.
   * @type {Collection}
   */
  public readonly store: Collection<string, T>;

  /**
   * The name of this handler.
   * @type {string}
   */
  public readonly name: string;

  /**
   * The filter to use when loading files.
   * @type {LoadFilter}
   */
  public loadFilter: LoadFilter;

  /**
   * The class that this component is loading.
   * @type {Class}
   */
  public class: Class<T>;

  /**
   * The directory to load files from.
   * @type {string}
   */
  public directory: string;

  /**
   * The client instance.
   * @type {Enjo}
   */
  readonly #client: Enjo;

  /**
   * @param {Enjo} client The client instance.
   * @param {string} name The name of this handler. Used for declaring the directory.
   * @param {HandlerOptions} options The options.
   */
  public constructor(client: Enjo, name: string, options: HandlerOptions = {}) {
    super();

    client.handlers.set(name, this);

    this.#client = client;
    this.store = new Collection();
    this.name = name;

    const {
      class: loading = EnjoComponent,
      directory = join(client.directory, name),
      loadFilter = () => true,
    } = options;

    this.class = loading as Class<T>;
    this.directory = directory;
    this.loadFilter = loadFilter;
  }

  /**
   * The client instance.
   * @type {Enjo}
   */
  public get client(): Enjo {
    return this.#client;
  }

  /**
   * Walks a directory.
   * @param {string} dir The directory to walk.
   * @returns {Tuple<string, string[]>[]}
   */
  private static walk(dir: string): Tuple<string, string[]>[] {
    return walk(dir).map((f) => [dir, relative(dir, f).split(sep)]);
  }

  /**
   * Finds a class within a module.
   * @param {Dictionary} module
   * @private
   */
  private static findModule(module: Dictionary): Class<unknown> | null {
    if (module.__esModule) {
      if (isClass(module.default)) {
        return module.default;
      }

      let _class: Class<unknown> | null = null;
      for (const key of Object.keys(module)) {
        const __class = module[key];
        if (isClass(__class)) {
          _class = __class;
          break;
        }
      }

      return _class;
    }

    if (!isClass(module)) throw new Error("File does not export a class.");

    return module;
  }

  /**
   * Get a component from the store.
   * @param {ComponentHandler} resolvable The component to get.
   * @returns {?EnjoComponent}
   */
  public get(resolvable: ComponentResolvable<T>): T | null {
    if (typeof resolvable === "string")
      return this.store.get(resolvable) ?? null;
    else if (resolvable instanceof this.class) return resolvable;
    else if (resolvable.id) return this.store.get(resolvable.id) ?? null;
    return null;
  }

  /**
   * Removes a component from the store.
   * @param {ComponentResolvable} resolvable The component to remove.
   * @param {boolean} emit Whether to emit the "removed" event.
   * @returns {boolean}
   */
  public remove(resolvable: ComponentResolvable<T>, emit = true): T | null {
    const c = this.get(resolvable);
    if (c) {
      const removed = this.store.delete(c.id);
      if (emit && removed) this.emit("removed", c);
    }

    return c ?? null;
  }

  /**
   * Loads a component.
   * @param {string} dir The directory of the component.
   * @param {string[]} file The path to the file, relative to the parent directory.
   * @param {boolean} [reload=false] Whether we're reloading a component.
   */
  public async load(
    dir: string,
    file: string[],
    reload = false
  ): Promise<T | null> {
    const path = join(dir, ...file);

    let mod: T | null = null;
    try {
      const Component = ComponentHandler.findModule(await import(path));

      if (!Component) return null;
      if (!isClass(Component)) {
        throw new Error(`File: "${file.join(sep)}" does not export a class.`);
      }

      mod = new Component(this.client) as T;
      mod._patch({ handler: this, dir, file });
      this._add(mod, reload);
    } catch (e) {
      this.emit("loadError", e, path);
    }

    delete require.cache[path];
    module.children.pop();

    return mod;
  }

  /**
   * Loads all components in the provided directory.
   * @param {string} [dir] The directory to read.
   * @returns {Promise<number>} The number of components loaded.
   */
  public async loadAll(dir = this.directory): Promise<number> {
    const files = ComponentHandler.walk(dir).filter((f) => {
      const full = join(f[0], ...f[1]);
      return this.loadFilter(full, lstatSync(full));
    });

    const all = await Promise.all(files.map((f) => this.load(f[0], f[1])));
    return all.filter((f) => f !== null).length;
  }

  /**
   * Defines the .toString behavior of this handler.
   * @returns {string}
   */
  public toString(): string {
    return this.name;
  }

  /**
   * Adds a new component to the store.
   * @param {*} component The component to add.
   * @param {boolean} reload Whether the component was reloaded.
   * @returns {EnjoComponent | null}
   */
  protected _add(component: unknown, reload = false): T | null {
    if (!(component instanceof this.class)) {
      this.emit(
        "loadError",
        new TypeError(`Only "${this}" can be loaded.`),
        component
      );

      return null;
    }

    this.store.delete(component.id);
    this.store.set(component.id, component);
    if (!reload) this.emit("load", component);

    return component;
  }
}

export type ComponentResolvable<
  C extends EnjoComponent = EnjoComponent
> = BaseResolvable<C>;

export type LoadFilter = (path: string, stats: Stats) => boolean;

export interface HandlerOptions {
  directory?: string;
  class?: Class<EnjoComponent>;
  loadFilter?: LoadFilter;
}
