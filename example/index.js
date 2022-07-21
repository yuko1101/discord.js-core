"use strict";
const { Core, Command, CustomEmoji, EmojiAction, ButtonAction, MessageCore, MessagePages, SelectMenuAction } = require("discord-core");
const { AutocompleteInteraction, Client, TextInputBuilder, ModalBuilder, ApplicationCommandOptionType, ActionRowBuilder, TextInputStyle, ButtonStyle } = require("discord.js");
require("dotenv").config();

const core = new Core(
    new Client({
        intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent"],
        allowedMentions: { repliedUser: false }
    }),
    { token: process.env.TOKEN, prefix: "pt!", debug: true, guildId: "736829048373903377" }
);

const emojis = [
    new CustomEmoji(core, "951644270312427570"),
]

core.client.on("messageCreate", msg => {
    console.log(msg);
})

const command = new Command({
    name: "ping",
    description: "pong",
    args: ["test"],
    options: [
        {
            name: "a",
            type: ApplicationCommandOptionType.Subcommand,
            description: "sub command",
            options: [
                {
                    name: "test",
                    type: ApplicationCommandOptionType.String,
                    description: "test",
                    required: true,
                    autocomplete: true,
                    autocompleter: (_interaction, value) => {
                        /** @type {AutocompleteInteraction} */
                        const interaction = _interaction
                        console.log(value);
                        if (value) interaction.respond([{ name: value.toLowerCase(), value: value.toUpperCase() }])
                    }
                },
                {
                    name: "test2",
                    type: ApplicationCommandOptionType.String,
                    description: "test",
                    required: true,
                    autocomplete: true,
                    autocompleter: (interaction, value) => {
                        console.log(value + "2");
                        if (value) interaction.respond([{ name: value, value: value }])
                    }
                }
            ]
        }
    ],
    supports: ["MESSAGE_CONTEXT_MENU", "SLASH_COMMAND", "MESSAGE_COMMAND"],
    run: async (ic, args, core) => {
        if (ic.interaction.isUserContextMenuCommand)
            console.log(args);
        const modal = new ModalBuilder().setTitle("test").setCustomId("test_modal");
        const textInput = new TextInputBuilder().setCustomId('favoriteColorInput').setLabel("What's your favorite color?").setStyle(TextInputStyle.Short);
        modal.addComponents(new ActionRowBuilder().addComponents(textInput));
        const messageCores = [
            new MessageCore({ message: { content: "pong 1" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
            new MessageCore({ message: { content: "pong 2" }, emojiActions: [new EmojiAction({ core: core, label: "❤", run: (messageReaction, user) => { console.log("reacted!") } })] }),
            new MessageCore({
                message: { content: "pong 3" }, buttonActions: [new ButtonAction({
                    core: core, label: "Click!", run: async (interaction) => {
                        interaction.showModal(modal);
                        const modalInteraction = await interaction.awaitModalSubmit({ time: 100000 });
                        if (modalInteraction) {
                            await modalInteraction.deferUpdate();
                            interaction.editReply(modalInteraction.fields.getTextInputValue("favoriteColorInput"));
                        }
                    }
                }).register()]
            }),];

        const pages = new MessagePages({
            messageCores: messageCores,
            enabledActions: ["BACK", new EmojiAction({ core: core, label: "❌", run: (reaction, user) => reaction.message.delete() }), "NEXT"],
            type: "BUTTON",
            timeout: 1000000,
            pageActions: {
                back: {
                    buttonStyle: ButtonStyle.Danger
                }
            }
        });

        // pages.setSelectMenu(new SelectMenuAction({
        //     core: core, label: "SELECT!", run: async (interaction) => {
        //         await interaction.deferUpdate();
        //         if (interaction.values.includes("a")) pages.gotoPage(1);
        //         else pages.gotoPage(2);
        //     }, options: [{ label: "a", value: "a" }, { label: "b", value: "b" }], disabled: false
        // }));

        await ic.deferReply();
        ic.followUp(pages);



        setTimeout(() => {
            ic.editReply(new MessagePages({
                messageCores: [new MessageCore({ message: { content: "pong 4" } }), new MessageCore({
                    message: { content: "pong 5" }, emojiActions: [new EmojiAction({ core: core, label: "✅", run: console.log })]
                })],
                enabledActions: ["BACK", new EmojiAction({ core: core, label: "❗", run: (reaction, user) => reaction.message.delete() }), "NEXT"],
            }));
        }, 10000);
    }
});

core.login();

core.addCommands(command);

core.client.on("ready", () => {
    core.applyCommands();
    emojis.forEach(emoji => emoji.fetch()); // or just use CustomEmoji.fetch() on send
});