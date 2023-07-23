"use strict";
const { Core, Command, CustomEmoji, ButtonAction, MessageCore, MessagePages } = require("discord.js-core");
const { Client, ApplicationCommandOptionType } = require("discord.js");
require("dotenv").config();

const core = new Core(
    new Client({
        intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent"],
        allowedMentions: { repliedUser: false }
    }),
    { token: process.env.TOKEN, prefix: "!", devMode: true, guildId: "736829048373903377" }
);

const emojis = [
    new CustomEmoji(core, "951644270312427570"),
];

core.addCommandsInDir("commands");

const command = new Command({
    name: "dice",
    description: "roll a dice",
    args: ["max-number"],
    options: [
        {
            name: "max-number",
            description: "max face number of the dice",
            type: ApplicationCommandOptionType.Integer,
            required: false,
        }
    ],
    supports: ["MESSAGE_CONTEXT_MENU", "SLASH_COMMAND", "MESSAGE_COMMAND"],
    run: async (ic, args, core) => {

        const max = Number(args["max-number"]) || 6;

        const messageCores = [
            async () => new MessageCore({
                message: { content: `${Math.floor(Math.random() * max) + 1}` }
            })
        ];

        const pages = new MessagePages({
            messageCores: messageCores,
        });
        pages.pageActions.push(
            [
                new ButtonAction({
                    core: core,
                    label: "Reroll",
                    run: async (interaction) => {
                        await interaction.deferUpdate();
                        pages.gotoPage(0);
                    }
                })
            ]
        );

        await ic.deferReply();
        await ic.followUp(pages);
    }
});

core.login();

core.addCommands(command);

core.client.on("ready", () => {
    core.applyCommands();
    emojis.forEach(emoji => emoji.resolve()); // or just use CustomEmoji.resolve() on send
});