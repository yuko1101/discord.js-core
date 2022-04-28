"use strict";
import { Core, Command, CustomEmoji, Pages, EmojiAction, ButtonAction, MessageCore, MessagePages } from "discord-core";
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
        const messageCores = [
            new MessageCore({ message: { content: "pong 1" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
            new MessageCore({ message: { content: "pong 2" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
            new MessageCore({ message: { content: "pong 3" }, buttonActions: [new ButtonAction({ core: core, label: "Click!", run: async (interaction) => { console.log("clicked!") } }).register()] }),
        ];

        const pages = new MessagePages({
            messageCores: messageCores,
            enabledActions: ["BACK", new EmojiAction({ core: core, label: "❌", run: (reaction, user) => reaction.message.delete() }), "NEXT"],
            type: "BUTTON",
            timeout: 10000,
        })

        pages.sendTo(ic.channel);



        // await ic.deferReply();
        // const messageCores = [
        //     new MessageCore({ message: { content: "pong 1" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
        //     new MessageCore({ message: { content: "pong 2" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
        //     new MessageCore({ message: { content: "pong 3" }, buttonActions: [new ButtonAction({ core: core, label: "Click!", run: async (interaction) => { console.log("clicked!") } }).register()] }),
        // ]
        // const pages = new Pages(messageCores);

        // pages.interactionReply(ic.interaction, { followUp: true });
    }
});

core.login();

core.addCommand(command);

core.client.on("ready", () => {
    core.applySlashCommands();
    emojis.forEach(emoji => emoji.fetch()); // or just use CustomEmoji.fetch() on send
});