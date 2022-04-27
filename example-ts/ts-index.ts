import { Command, Core, MessageCore, Pages } from "discord-core";
import { Client, Intents } from "discord.js";
import 'dotenv/config'

const core: Core = new Core(
    new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
    }),
    { debug: true, prefix: "pt!", token: process.env.TOKEN as string }
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
        const pages = new Pages(messageCores, {
            visuals: {

            }
        })
    }
})

const commands: Command[] = [
    pingCommand
]

commands.forEach(command => core.addCommand(command));

core.login(() => core.applySlashCommands());