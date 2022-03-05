"use strict";
import { Core, Command } from "discord-core";
import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const core = new Core(
    new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
    }),
    { token: process.env.TOKEN, prefix: "pt!", debug: true, guildId: "736829048373903377" }
);

core.login();


const command = new Command({
    name: "ping",
    description: "Pong!",
    args: [],
    options: [],
    aliases: [],
    run: async (msg, args, core) => {
        return {
            content: "Pong!"
        };
    }
});