"use strict";
import { Core, Command } from "discord-core";
import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const command = new Command({
    name: "ping",
    description: "pong",
    args: ["test"],
    options: [
        {
            name: "test",
            type: "STRING",
            description: "test",
            required: true
        }
    ],
    type: "MESSAGE_COMMAND",
    run: async (ic, args, core) => {
        console.log(args);
        return {
            content: `pong ${args["test"]}`,
        };
    },
    runAfter: async (ic, sent, args, core) => {
        sent.edit(`pong ${args["test"]} again`);
    }
});

const core = new Core(
    new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
        allowedMentions: { repliedUser: false }
    }),
    { token: process.env.TOKEN, prefix: "pt!", debug: true, guildId: "736829048373903377" }
);

core.login();

core.addCommand(command);

core.client.on("ready", () => { core.applySlashCommands(); });