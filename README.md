<h1 align="center">Neocord: Enjo</h1>

> The official bot framework for the neocord discord library.

## Installation and Usage.

As of **09/30/2020** `day/month/year`, Enjo will only support **node.js v12** and above.

```shell script
yarn add @neocord/enjo
```

###### Basic Usage

```ts
import { Enjo, Commands, Listeners } from "@neocord/enjo";

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

## External Commands

*recommended*

```ts
import { Command, Parameter, apply } from "@neocord/enjo";

@init({
  args: {
    command: b => b.type(Parameter.Command)
  }
})
export class HelpCommand extends Command {
  public async exec(context: Command.Context, { command }: args) {
    context.reply("bruh")
  }
  
}

type args = {
  command?: Command
}


```

---

<p align="center">
    Licensed under the <strong>MIT License</strong>.
</p>

