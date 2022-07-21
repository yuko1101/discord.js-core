# discord-core
A simple bot handler for [discord.js/v14](https://github.com/discordjs/discord.js)

## 1. Installation
Run `npm install yuko1101/discord-core` in the terminal.  
If you didn't install discord.js, also run `npm install discord.js`.

## 2. Set-up
Create `index.js` file and edit it.

```js
const { Client } = require("discord.js");
const { Core } = require("discord-core");

const core = new Core(
    new Client({
        // MessageContent requires to be enabled on the application developer portal (https://discord.com/developers/applications/)
        intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent"],
        allowedMentions: { repliedUser: false } // Disable mention on reply (Recommended)
    }),
    {
        prefix: "!",
        guildId: "Your Guild ID", // if not provided, your commands will be applied to global (to all guilds, DMs, and groups)
        token: "Your Token",
    }
);

core.login();
```
Run the index.js with `node .` or `node index.js` in the terminal,
and you will find the bot is online.

## 3. Adding Commands (Optional)
You can handle *SlashCommand*, *MessageCommand* and *ContextMenu* in single code.

### Import the Command class
```js
const { Command } = require("discord-core");
```

### Code a command
```js
const command = new Command({
    name: "mention",
    description: "Mentions a user",
    aliases: ["m"], // aliases for MessageCommand
    args: ["target"], // args names for MessageCommand
    // options for SlashCommand
    options: [
        {
            name: "target",
            type: ApplicationCommandOptionType.User,
            description: "The user to mention",
            required: true,
        }
    ],
    supports: ["USER_CONTEXT_MENU", "SLASH_COMMAND", "MESSAGE_COMMAND"], // Types of commands which this command supports
    run: async (ic, args, core) => {
        // Type of ic is InteractionCore, which can combine Message and Interaction.
        // You can reply to Message or Interaction in the same method with InteractionCore.
        
        // If the interaction is from UserContextMenu, target id is in args["user"] (If from MessageContextMenu, in args["message"])
        const target = (ic.hasInteraction && ic.interaction.isUserContextMenuCommand()) ? args["user"] : args["target"]; 
        const mention = `<@${target}>`;
        await ic.reply({ content: mention }); // Send reply message
    }
});
```

### Add to core
```js
core.addCommand(command);
```

### Apply to Discord (Adding Slash-Command and Context-Menu against Discord)
You can apply registered commands with `core.applyCommands()`.
```js
core.login(() => core.applyCommands()); // login, and apply commands on ready
```

## More examples available in example folder
See [example folder](example) for more examples!  
And typescript example [here](example-ts)!
