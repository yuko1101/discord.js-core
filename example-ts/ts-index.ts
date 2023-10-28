import { Command, Core, MessageCore, MessagePages } from "..";
import { ApplicationCommandOptionType, GatewayIntentBits } from "discord.js";
import "dotenv/config";

const core: Core = new Core(
    {
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
        allowedMentions: { repliedUser: false },
        devMode: true,
        prefix: "pt!",
        token: process.env.TOKEN as string,
        guildIds: ["736829048373903377"],
    },
);

const pingCommand: Command = new Command({
    name: "ping",
    description: "Pong!",
    supportsSlashCommand: true,
    supportsContextMenu: true,
    supportedContextMenus: ["MESSAGE", "USER"],
    supportsMessageCommand: true,
    run: async (ic) => {
        const messageCores = [
            new MessageCore({
                message: { content: "Pong!" },
            }),
            new MessageCore({
                message: { content: "Pong! 2" },
            }),
        ];
        const pages = new MessagePages({
            messageCores: messageCores,
        });

        ic.reply(pages);
    },
});

const mentionCommand = new Command({
    name: "mention",
    description: "Mentions a user",
    messageCommandAliases: ["m"], // aliases for MessageCommand
    args: {
        "target": {
            type: ApplicationCommandOptionType.User,
            description: "The user to mention",
            required: true,
        },
    },
    supportsMessageCommand: false,
    supportsContextMenu: true,
    supportedContextMenus: ["USER"], // Types of context menus which this command supports
    supportsSlashCommand: true,
    run: async (ic, args) => {
        // Type of ic is InteractionCore, which can combine Message and Interaction.
        // You can reply to Message or Interaction in the same method with InteractionCore.

        // If the interaction is from UserContextMenu, target id is in args["user"] (If from MessageContextMenu, in args["message"])
        const target = ic.contextMenuUser ?? args?.["target"];
        if (!target) return;

        const mention = `<@${target.id}>`;
        await ic.reply({ content: mention }); // Send reply message
    },
});

core.addCommands(pingCommand, mentionCommand);

core.login(() => core.applyCommands());