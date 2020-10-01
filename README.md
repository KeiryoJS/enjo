<h1 align="center">Neocord: Enjo</h1>

> The official bot framework for the neocord discord library.

###### Disclaimer

<p style="font-size: .5em;">
    <strong>Enjo</strong> is currently in alpha.
    Not all features are currently implemented... this should not be used in production.
</p>

## Installation and Usage.

As of **09/30/2020** `day/month/year`, Enjo will only support **node.js v12** and above.

```shell script
yarn add @neocord/enjo
```

###### Basic Usage

```ts
import { Enjo, Commands, Listeners } from "enjo";

class MyClient extends Enjo {
  public commands = new Commands(this);
  public listeners = new Listeners(this);
}

const client = new MyClient();

client.commands.add({
  id: "ping",
  triggers: ["ping"]
}, (ctx) => {
  ctx.reply("**Pong!**");
});
```

## Links

- **Support Server**: [discord.gg/5WD9KhF](https://discord.gg/5WD9KhF)
- **Github**: <https://github.com/neo-cord/enjo>
- **NPM**: <https://npmjs.com/enjo>

---

<p align="center">
    Licensed under the <strong>MIT License</strong>.
</p>

