# discord.js-core
A simple bot handler for [discord.js/v14](https://github.com/discordjs/discord.js)

### Features
 - Easy Application Commands (including easy AutoCompleters)
 - Easy Customizable MessagePages
 - Easy Actions (EmojiAction, ButtonAction, SelectMenuAction)
 - Easy to combine Actions and a message (called MessageCore)

## 1. Installation
Run `npm install discord.js-core` in the terminal.  

**DO NOT install discord.js.**
discord.js-core has discord.js inside.

Installing another discord.js can occur some class definition errors.

If you installed discord.js, uninstall it by running `npm uninstall discord.js`

## 2. Set-up
Create `index.js` file and edit it.

```js
const { Client } = require("discord.js");
const { Core } = require("discord.js-core");

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
        // debug mode, which enables you to develop your bot more easily. (e.g. All commands have "-debug" at the end of their name in debug mode)
        debug: false, 
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
const { Command } = require("discord.js-core");
```

### [Case 1] Code a command in index.js
Let's code your own command.

Here is an example of commands.

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

#### Add to core
Don't forget to register your commands.
```js
core.addCommands(command);
```



### [Case 2] Code more commands
You can also add commands from command directory.

Create "commands" folder, and a file for each command.

The contents of the file are as follows.

commands/test_command.js
```js
const { Command } = require("discord.js-core");
module.exports = new Command(...);
```

#### Add the commands to core
```js
core.addCommandsInDir("commands");
```

### Apply to Discord (Adding Slash-Command and Context-Menu against Discord)
You can apply registered commands with `core.applyCommands()`.
```js
core.login(() => core.applyCommands()); // login, and apply commands on ready
```


## More examples available in example folder
See [example folder](example) for more examples!  
And typescript example [here](example-ts)!
