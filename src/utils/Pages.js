const { MessageOptions, Message, TextBasedChannel, MessageActionRow, MessageButton, Interaction, User } = require("discord.js");
const Action = require("../action/Action");
const EmojiAction = require("../action/EmojiAction");
const { bindOptions } = require("./utils");

const defaultOptions = {
    startPage: 0,
    visuals: {
        first: "⏪",
        back: "◀",
        forward: "▶",
        last: "⏩",
        shows: ["BACK", "FORWARD"],
    },
    useButtons: false,
    timeout: null,
    userFilter: (user) => true
}

const visuals = ["BACK", "FORWARD", "FIRST", "LAST"];

module.exports = class Pages {
    /**
     * @param {MessageOptions[]} messages 
     * @param {object} options
     * @param {number} options.startPage
     * @param {object} options.visuals
     * @param {string} options.visuals.first
     * @param {string} options.visuals.back
     * @param {string} options.visuals.forward
     * @param {string} options.visuals.last
     * @param {Array<["FIRST"|"BACK"|"FORWARD"|"LAST"|Action]>} options.visuals.shows
     * @param {boolean} options.useButtons
     * @param {number} options.timeout
     * @param {(user: User) => boolean} options.userFilter
     */
    constructor(messages, options = {}) {
        /** @readonly @type {MessageOptions[]} */
        this.messages = messages;
        /** @readonly */
        this.options = bindOptions(defaultOptions, options);
        /** @readonly @type {number} */
        this.startPage = this.options.startPage;
        /** @readonly @type {{first: string, back: string, forward: string, last: string, shows: Array<["FIRST"|"BACK"|"FORWARD"|"LAST"|Action]>}} */
        this.visuals = this.options.visuals;
        /** @readonly @type {boolean} */
        this.useButtons = this.options.useButtons;
        /** @readonly @type {number} */
        this.timeout = this.options.timeout;
        /** @readonly @type {(user: User) => boolean} */
        this.userFilter = this.options.userFilter;

        /** @readonly @type {boolean} */
        this.isSent = false;

        /** @readonly @type {Message | null} */
        this.sentMessage = null;

        /** @readonly @type {Interaction | null} */
        this.interaction = null;

        /** @readonly @type {number} */
        this.currentPage = this.options.startPage;
    }

    /**
     * @description Sends the message pages to the channel
     * @param {TextBasedChannel} channel
     * @returns {Promise<Message>}
     */
    async sendTo(channel) {
        if (this.isSent) throw new Error("This message pages has already been sent.");

        this.sentMessage = await channel.send(this.getMessageOptionsWithButtons(this.currentPage));

        this.isSent = true;


        if (this.useButtons) {
            this.collectInteraction();
        } else {
            this.setupReactions();

            this.collectReactions();
        }

        return this.sentMessage;
    }

    /**
     * @description Sends the message pages as a reply of interaction
     * @param {Interaction} interaction 
     * @param {object} options
     * @param {boolean} options.followUp
     * @param {boolean} options.ephemeral
     */
    async reply(interaction, options) {
        options = bindOptions({ followUp: false, ephemeral: false }, options);
        if (this.isSent) throw new Error("This message pages has already been sent.");

        if ((interaction.ephemeral || options.ephemeral) && !this.useButtons) throw new Error("Ephemeral mode is only available when using buttons.");

        if (!options.followUp && !interaction.reply) {
            throw new Error("Interaction must have the reply() function. Please check the interaction is replyable.");
        }
        if (options.followUp && !interaction.followUp) {
            throw new Error("Interaction must have the followUp() function. Please check the interaction is followUpable.");
        }

        this.sentMessage = !options.followUp ? await interaction.reply({ ...this.getMessageOptionsWithButtons(this.currentPage), fetchReply: true, ephemeral: options.ephemeral })
            : await interaction.followUp({ ...this.getMessageOptionsWithButtons(this.currentPage), fetchReply: true, ephemeral: options.ephemeral });

        this.isSent = true;
        this.interaction = interaction;
        if (this.useButtons) {
            this.collectInteraction();
        } else {
            this.setupReactions();

            this.collectReactions();
        }
    }

    async nextPage() {
        if (this.currentPage === this.messages.length - 1) return;

        // if this.isSent is false, just increment the currentPage
        this.currentPage++;

        if (!this.isSent) return;

        if (this.interaction) {
            if (!this.interaction.editReply) throw new Error("Interaction must have the editReply() function. Please check the reply of interaction is editable.");

            await this.interaction.editReply(this.getMessageOptionsWithButtons(this.currentPage));
        } else {
            await this.sentMessage.edit(this.getMessageOptionsWithButtons(this.currentPage));
        }


    }

    async previousPage() {
        if (this.currentPage === 0) return;

        // if this.isSent is false, just decrement the currentPage
        this.currentPage--;

        if (!this.isSent) return;

        if (this.interaction) {
            if (!this.interaction.editReply) throw new Error("Interaction must have the editReply() function. Please check the reply of interaction is editable.");

            await this.interaction.editReply(this.getMessageOptionsWithButtons(this.currentPage));
        } else {
            await this.sentMessage.edit(this.getMessageOptionsWithButtons(this.currentPage));
        }
    }

    /** 
     * @private 
     * @param {number} page
     * @returns {MessageOptions}
     */
    getMessageOptionsWithButtons(page) {
        const buttons = new MessageActionRow();
        if (this.useButtons) {
            for (const label of this.visuals.shows) {
                if (visuals.includes(label)) {
                    if (label === "FIRST") buttons.addComponents(
                        new MessageButton().setCustomId("DISCORD_CORE_PAGE_FIRST").setStyle("PRIMARY").setLabel(this.visuals.first).setDisabled(this.currentPage === 0)
                    );
                    if (label === "BACK") buttons.addComponents(
                        new MessageButton().setCustomId("DISCORD_CORE_PAGE_BACK").setStyle("PRIMARY").setLabel(this.visuals.back).setDisabled(this.currentPage === 0)
                    );
                    if (label === "FORWARD") buttons.addComponents(
                        new MessageButton().setCustomId("DISCORD_CORE_PAGE_FORWARD").setStyle("PRIMARY").setLabel(this.visuals.forward).setDisabled(page === this.messages.length - 1)
                    );
                    if (label === "LAST") buttons.addComponents(
                        new MessageButton().setCustomId("DISCORD_CORE_PAGE_LAST").setStyle("PRIMARY").setLabel(this.visuals.last).setDisabled(this.currentPage === this.messages.length - 1)
                    );
                } else {
                    if (label.isButtonAction) {
                        buttons.addComponents(label.getButton());
                    }
                }
            }

        }

        const messageOptions = { ...this.messages[page] }; // make immutable
        if (this.useButtons) {
            messageOptions.components = [...(messageOptions.components || []), buttons];
        }
        return messageOptions;
    }

    /**
     * @private
     */
    collectInteraction() {
        const collector = this.sentMessage.createMessageComponentCollector({
            time: this.timeout,
        });
        collector.on("collect", async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId.startsWith("DISCORD_CORE_PAGE_")) {
                await interaction.deferUpdate();
                switch (interaction.customId) {
                    case "DISCORD_CORE_PAGE_FIRST":
                        await this.firstPage();
                        break;
                    case "DISCORD_CORE_PAGE_BACK":
                        await this.previousPage();
                        break;
                    case "DISCORD_CORE_PAGE_FORWARD":
                        await this.nextPage();
                        break;
                    case "DISCORD_CORE_PAGE_LAST":
                        await this.lastPage();
                        break;
                }
            }
        });
        collector.on("end", async (collected, reason) => {
            console.log(`MessagePages collector ended with reason: ${reason}`);
            if (reason === "time") {
                if (this.interaction) {
                    if (!this.interaction.editReply) throw new Error("Interaction must have the editReply() function. Please check the reply of interaction is editable.");

                    await this.interaction.editReply({ ...this.messages[this.currentPage], components: this.messages[this.currentPage].components || [] });
                } else {
                    await this.sentMessage.edit({ ...this.messages[this.currentPage], components: this.messages[this.currentPage].components || [] });
                }
            }
        });
    }

    /**
     * @private
     */
    collectReactions() {
        const collector = this.sentMessage.createReactionCollector({ filter: (reaction, user) => this.userFilter(user), time: this.timeout });
        collector.on("collect", async (reaction, user) => {
            // return if the reaction is from the bot
            if (user.id === this.sentMessage.author.id) return;
            if (reaction.emoji.toString() === this.visuals.first) {
                this.firstPage();
            } else if (reaction.emoji.toString() === this.visuals.back) {
                this.previousPage();
            } else if (reaction.emoji.toString() === this.visuals.forward) {
                this.nextPage();
            } else if (reaction.emoji.toString() === this.visuals.last) {
                this.lastPage();
            } else {
                return;
            }
            reaction.users.remove(user);
        });
        collector.on("end", async (collected, reason) => {
            console.log(`MessagePages collector ended with reason: ${reason}`);
            if (reason === "time") {
                const pageEmojis = this.getPageEmojis();
                if (this.sentMessage.reactions.cache.every(reaction => pageEmojis.includes(reaction.emoji.toString()))) {
                    this.sentMessage.reactions.removeAll();
                } else {
                    for (const emoji of pageEmojis) {
                        this.sentMessage.reactions.resolve(emoji)?.remove();
                    }
                }
            }
        });
    }

    /**
     * @private
     */
    async setupReactions() {
        // apply emoji actions (in for loop at "add reactions", applying has some delay)
        for (const reaction of this.visuals.shows) {
            if (typeof reaction !== "string" && reaction.isEmojiAction) {
                /** @type {EmojiAction} */
                const action = reaction;
                action.apply(this.sentMessage, { timeout: this.timeout, autoReact: false });
            }
        }


        // add reactions
        for (const reaction of this.visuals.shows) {
            if (typeof reaction === "string") {
                await this.sentMessage.react(this.visuals[reaction.toLowerCase()]);
            } else if (reaction.isEmojiAction) {
                await this.sentMessage.react(reaction.label);
            }
        }
    }

    /**
     * @private
     * @description This function is used to get emojis which reacted at the message pages by the bot.
     */
    getPageEmojis() {
        const pageEmojis = [];
        if (this.visuals.shows.includes("FIRST")) pageEmojis.push(this.visuals.first);
        if (this.visuals.shows.includes("BACK")) pageEmojis.push(this.visuals.back);
        if (this.visuals.shows.includes("FORWARD")) pageEmojis.push(this.visuals.forward);
        if (this.visuals.shows.includes("LAST")) pageEmojis.push(this.visuals.last);
        pageEmojis.push(...this.visuals.shows.filter(show => !visuals.includes(show)).filter(show => show.isEmojiAction).map(emojiAction => emojiAction.label));
        console.log(pageEmojis);
        return pageEmojis;
    }
}
