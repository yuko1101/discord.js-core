import { Command, Core, MessageCore, MessagePages } from "discord.js-core";
import { Client, GatewayIntentBits } from "discord.js";
import 'dotenv/config'

const core: Core = new Core(
    new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
        allowedMentions: { repliedUser: false }
    }),
    { debug: true, prefix: "pt!", token: process.env.TOKEN as string, guildId: "736829048373903377" }
);

const pingCommand: Command = new Command({
    name: "ping",
    description: "Pong!",
    run: async (ic, args, core) => {
        const messageCores = [
            new MessageCore({
                message: { content: "Pong!" }
            }),
            new MessageCore({
                message: { content: "Pong! 2" }
            })
        ];
        const pages = new MessagePages({
            messageCores: messageCores
        });
    }
})

const commands: Command[] = [
    pingCommand
]

commands.forEach(command => core.addCommands(command));

core.login(() => core.applyCommands());