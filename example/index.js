"use strict";
import { Core, Command, CustomEmoji, Pages, EmojiAction, ButtonAction } from "discord-core";
import { Client, Intents } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const core = new Core(
    new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
        allowedMentions: { repliedUser: false }
    }),
    { token: process.env.TOKEN, prefix: "pt!", debug: true, guildId: "736829048373903377" }
);

const emojis = [
    new CustomEmoji(core, "951644270312427570"),
]

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
    type: "BOTH",
    run: async (ic, args, core) => {
        await ic.deferReply();
        await ic.followUp({ content: "pong 2" });
        ic.interaction.deleteReply();
    }
});

core.login();

core.addCommand(command);

core.client.on("ready", () => {
    core.applySlashCommands();
    emojis.forEach(emoji => emoji.fetch()); // or just use CustomEmoji.fetch() on send
});