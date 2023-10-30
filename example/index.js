// @ts-check

const { Core, Command, CustomEmoji } = require("discord.js-core");
const { ApplicationCommandOptionType, Partials } = require("discord.js");
require("dotenv").config();

const token = process.env.TOKEN;
if (!token) throw new Error("Invalid bot token");

const core = new Core(
    {
        intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent", "DirectMessages"],
        partials: [Partials.Channel], // this is required for MessageCommand in DMs
        allowedMentions: { repliedUser: false },
        token,
        prefix: "!",
        devMode: true,
        guildIds: ["736829048373903377"],
    }
);

const emojis = [];

core.addCommandsInDir("commands");

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
    supportsSlashCommand: true,
    supportsContextMenu: true,
    supportedContextMenus: ["USER"],
    run: async (ic, args) => {
        // Type of ic is InteractionCore, which can combine Message and Interaction.
        // You can reply to Message or Interaction in the same method with InteractionCore.

        // If the interaction is from UserContextMenu, target id is in ic.contextMenuUser (If from MessageContextMenu, in ic.contextMenuMessage)
        const target = ic.contextMenuUser ?? args?.["target"];
        if (!target) return ic.reply({ content: "Target user not found" }); // Send reply message

        const mention = `<@${target.id}>`;
        await ic.reply({ content: mention }); // Send reply message
    },
});


core.login((core) => {
    emojis.push(new CustomEmoji(core, "951644270312427570"));
});

core.addCommands(command);

core.client.on("ready", () => {
    core.applyCommands();
    emojis.forEach(emoji => emoji.resolve()); // or just use CustomEmoji.resolve() on send
});