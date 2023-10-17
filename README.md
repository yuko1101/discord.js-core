# discord.js-core
A simple bot handler for [discord.js/v14](https://github.com/discordjs/discord.js)

### Features
 - Easy Application Commands (including easy AutoCompleters)
 - Easy Customizable MessagePages
 - Easy Actions (EmojiAction, ButtonAction, SelectMenuAction)
 - Easy to combine Actions and a message (called MessageCore)

## Installation
Run `npm install discord.js-core` in the terminal.  

## Set-up
Create `index.js` file and edit it.

```js
const { Core } = require("discord.js-core");

const core = new Core({

    /* discord.js client options */

    // MessageContent requires to be enabled on the application developer portal (https://discord.com/developers/applications/)
    intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent"],
    allowedMentions: { repliedUser: false }, // Disable mention on reply (Recommended)


    /* discord.js-core core options */

    prefix: "!", // message command prefix
    guildId: "Your Guild ID", // if not provided, your commands will be applied to global (to all guilds, DMs, and groups)
    token: "Your Token",
    // debug mode, which enables you to develop your bot more easily. (e.g. All commands have "dev-" at the head of their name in debug mode)
    // when `devMode` is true, `guildId` or `devGuild` must be provided.
    devMode: false,
});

core.login();
```
Run the index.js with `node .` or `node index.js` in the terminal,
and you will find the bot is online.

## Commands
You can handle *SlashCommand*, *MessageCommand* and *ContextMenu* in a single code.

### Import the Command class
```js
const { Command } = require("discord.js-core");
// or in ESM, import { Command } from "discord.js-core";
```

### Code a command
Let's code your own command.

Here is an example of commands.

```js
const command = new Command({
    name: "mention",
    description: "Mentions a user",
    messageCommandAliases: ["m"], // aliases for MessageCommand
    args: {
        "target": {
            type: ApplicationCommandOptionType.User,
            description: "The user to mention",
            required: true,
            messageCommand: true, // if this option is also for MessageCommand, set this to true; otherwise, set this to false
        },
    },
    supportsMessageCommand: true,
    supports: ["USER_CONTEXT_MENU", "SLASH_COMMAND"], // Types of commands which this command supports
    run: async (ic, args) => {
        // Type of ic is InteractionCore, which can combine Message and Interaction.
        // You can reply to Message or Interaction in the same method with InteractionCore.

        // If the interaction is from UserContextMenu, target id is in ic.contextMenuUser (If from MessageContextMenu, in ic.contextMenuMessage)
        const target = ic.contextMenuUser ?? args["target"];
        if (!target) return ic.reply({ content: "Target user not found" }); // Send reply message

        const mention = `<@${target.id}>`;
        await ic.reply({ content: mention }); // Send reply message
    },
});
```
This command enables users to mention a specific user by using slash command, message command, or context menu.

**And DO NOT forget to register your commands.**
```js
core.addCommands(command);
```
---
### Registering multiple commands from directory
You can also add commands from command directory.

Create "commands" folder, and a file for each command.

The contents of the file are as follows.

###### commands/test_command.js
```js
const { Command } = require("discord.js-core");
module.exports = new Command(...);

// or in ESM
// import { Command } from "discord.js-core";
// export default new Command(...);
```

#### Register the commands in "commands" directory to core
```js
core.addCommandsInDir("commands");
```

### Apply to Discord (Adding Slash-Command and Context-Menu against Discord)
Apply registered commands with `core.applyCommands()`.
```js
core.login(() => core.applyCommands()); // login, and apply commands on ready
```


## More examples available in example folder
See [example folder](example) for more examples!  
And typescript example [here](example-ts)!
