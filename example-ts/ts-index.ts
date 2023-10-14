import { Command, Core, MessageCore, MessagePages } from "discord.js-core";
import { ApplicationCommandOptionType, GatewayIntentBits } from "discord.js";
import "dotenv/config";

const core: Core = new Core(
    {
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
        allowedMentions: { repliedUser: false },
        devMode: true,
        prefix: "pt!",
        token: process.env.TOKEN as string,
        guildId: "736829048373903377",
    },
);

const pingCommand: Command = new Command({
    name: "ping",
    description: "Pong!",
    supports: ["SLASH_COMMAND", "USER_CONTEXT_MENU", "MESSAGE_CONTEXT_MENU"],
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
            messageCommand: false,
        },
    },
    supportsMessageCommand: false,
    supports: ["USER_CONTEXT_MENU", "SLASH_COMMAND"], // Types of commands which this command supports
    run: async (ic, args) => {
        // Type of ic is InteractionCore, which can combine Message and Interaction.
        // You can reply to Message or Interaction in the same method with InteractionCore.

        // If the interaction is from UserContextMenu, target id is in args["user"] (If from MessageContextMenu, in args["message"])
        const target = ic.contextMenuUser ?? args["target"];
        const mention = `<@${target.id}>`;
        await ic.reply({ content: mention }); // Send reply message
    },
});

core.addCommands(pingCommand, mentionCommand);

core.login(() => core.applyCommands());