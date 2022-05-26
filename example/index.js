"use strict";
const { Core, Command, CustomEmoji, EmojiAction, ButtonAction, MessageCore, MessagePages, SelectMenuAction } = require("discord-core");
const { AutocompleteInteraction, Client, Intents, MessageActionRow, TextInputComponent, Modal } = require("discord.js");
require("dotenv").config();

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
            name: "a",
            type: "SUB_COMMAND",
            description: "sub command",
            options: [
                {
                    name: "test",
                    type: "STRING",
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
                    type: "STRING",
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
        console.log(args);
        const modal = new Modal().setTitle("test").setCustomId("test_modal");
        const textInput = new TextInputComponent().setCustomId('favoriteColorInput').setLabel("What's your favorite color?").setStyle('SHORT');
        modal.addComponents(new MessageActionRow().addComponents(textInput));
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
                    buttonStyle: "DANGER"
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