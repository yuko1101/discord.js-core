import { Core } from "discord-core";
import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const core: Core = new Core(
    new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
    }),
    { debug: true, prefix: "pt!", token: process.env.TOKEN }
);

core.login();