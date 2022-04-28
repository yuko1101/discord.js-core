const { Message, TextBasedChannel, MessageOptions, MessageButton, MessageActionRow, MessageButtonStyleResolvable, MessageReaction } = require("discord.js");
const ButtonAction = require("../action/ButtonAction");
const Action = require("../action/Action");
const { bindOptions } = require("../utils/utils");
const MessageCore = require("./MessageCore");
const EmojiAction = require("../action/EmojiAction");

const actionsList = ["FIRST", "BACK", "NEXT", "LAST"];

const defaultOptions = {
    messageCores: [],
    startPageIndex: 0,
    pageActions: {
        first: {
            label: "⏪",
            buttonStyle: "PRIMARY",
        },
        back: {
            label: "◀",
            buttonStyle: "PRIMARY",
        },
        next: {
            label: "▶",
            buttonStyle: "PRIMARY",
        },
        last: {
            label: "⏩",
            buttonStyle: "PRIMARY",
        }
    },
    enabledActions: ["BACK", "NEXT"],
    useButtons: false,
    timeout: null,
    userFilter: (user) => true
};

module.exports = class MessagePages {
    /**
     * @param {object} [options]
     * @param {(MessageCore | () => Promise<MessageCore>)[]} options.messageCores
     * @param {number} [options.startPageIndex]
     * @param {object} [options.pageActions]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.first]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.back]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.next]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.last]
     * @param {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} [options.enabledActions]
     * @param {boolean} [options.useButtons]
     * @param {number} [options.timeout]
     * @param {(User) => Promise<boolean>} [options.userFilter]
     */
    constructor(options) {
        /** @readonly @type {object} */
        this.options = bindOptions(defaultOptions, options);
        /** @readonly @type {(MessageCore|() => Promise<MessageCore>)[]} */
        this.messageCores = this.options.messageCores;
        if (this.messageCores.length === 0) {
            throw new Error("MessageCores cannot be empty");
        }
        /** @readonly @type {number} */
        this.startPageIndex = this.options.startPageIndex;
        /** @readonly @type {{first: {label: string, buttonStyle: MessageButtonStyleResolvable}, back: {label: string, buttonStyle: MessageButtonStyleResolvable}, next: {label: string, buttonStyle: MessageButtonStyleResolvable}, last: {label: string, buttonStyle: MessageButtonStyleResolvable}}} */
        this.pageActions = this.options.pageActions;
        /** @readonly @type {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} */
        this.enabledActions = this.options.enabledActions;
        /** @readonly @type {boolean} */
        this.useButtons = this.options.useButtons;
        /** @readonly @type {number | null} */
        this.timeout = this.options.timeout;
        /** @readonly @type {(User) => Promise<boolean>} */
        this.userFilter = this.options.userFilter;


        /** @readonly @type {boolean} */
        this.isSent = false;
        /** @readonly @type {Message | null} */
        this.sentMessage = null;
        /** @readonly @type {Interaction | null} */
        this.interaction = null;
        /** @readonly @type {number} */
        this.currentPageIndex = this.startPageIndex;
    }

    /**
     * Sends this MessagePages message to the channel
     * @param {TextBasedChannel} channel
     * @returns {Promise<Message>}
     */
    async sendTo(channel) {
        if (this.isSent) throw new Error("This MessagePages has already been sent.");

        // send message
        this.sentMessage = await channel.send(await this._getMessageOptionsWithComponents(this.currentPageIndex));
        this.isSent = true;

        // apply reactions
        this._manageActions({ newIndex: this.currentPageIndex, shouldApplyPageActions: true });
        this._updateReactions();

        if (this.useButtons) {

        } else {
            this._activateReactionCollector();
        }

        // TODO: setup buttons collector and apply the EmojiActions.


    }

    // TODO: add support for interactions

    /**
     * 
     * @param {number} index 
     * @returns 
     */
    async gotoPage(index) {
        if (!this.isSent) throw new Error("This MessagePages hasn't been sent yet. Please send it first.");
        if (index === this.currentPageIndex) return;
        if (index < 0 || index >= this.messageCores.length) throw new Error("Index out of bounds");

        const oldIndex = this.currentPageIndex;
        this.currentPageIndex = index;

        if (this.interaction) {
            if (!this.interaction.editReply) throw new Error("Interaction must have the editReply() function. Please check the reply of interaction is editable.");
            await this.interaction.editReply(await this._getMessageOptionsWithComponents(this.currentPageIndex));
        } else {
            await this.sentMessage.edit(await this._getMessageOptionsWithComponents(this.currentPageIndex));
        }
        this._manageActions({ oldIndex: oldIndex, newIndex: this.currentPageIndex });
        this._updateReactions();
    }

    /** 
     * @private
     * @param {number} index
     * @returns {Promise<MessageOptions>}
     */
    async _getMessageOptionsWithComponents(index) {
        const buttons = this._getButtons();
        const messageOptions = { ...(await this._getPage(index)).getMessage() }; // make immutable
        if (buttons.length > 0) {
            messageOptions.components = [...(messageOptions.components || []), new MessageActionRow().addComponents(...buttons)];
        }
        return messageOptions;
    }


    /**
     * @private
     * @param {number} index
     * @returns {Promise<MessageCore>}
     */
    async _getPage(index) {
        /** @type {MessageCore} */
        const messageCore = typeof this.messageCores[index] === "function" ? await this.messageCores[index]() : this.messageCores[index];
        return messageCore;
    }


    /** 
     * Gets necessary buttons for this MessagePages
     * @private
     * @returns {MessageButton[]}
     */
    _getButtons() {
        const buttons = [];
        for (const action of this.enabledActions) {
            if (typeof action === "object" && action instanceof ButtonAction) {
                buttons.push(action.getButton());
            } else if (typeof action === "string" && this.useButtons) {
                if (actionsList.includes(action)) {
                    if (action === "FIRST") {
                        buttons.push(new MessageButton().setCustomId("DISCORD_CORE_MESSAGE_PAGES_FIRST").setStyle(this.pageActions.first.buttonStyle).setLabel(this.pageActions.first.label).setDisabled(this.currentPageIndex === 0));
                    } else if (action === "BACK") {
                        buttons.push(new MessageButton().setCustomId("DISCORD_CORE_MESSAGE_PAGES_BACK").setStyle(this.pageActions.back.buttonStyle).setLabel(this.pageActions.back.label).setDisabled(this.currentPageIndex === 0));
                    } else if (action === "NEXT") {
                        buttons.push(new MessageButton().setCustomId("DISCORD_CORE_MESSAGE_PAGES_NEXT").setStyle(this.pageActions.next.buttonStyle).setLabel(this.pageActions.next.label).setDisabled(this.currentPageIndex === this.messageCores.length - 1));
                    } else if (action === "LAST") {
                        buttons.push(new MessageButton().setCustomId("DISCORD_CORE_MESSAGE_PAGES_LAST").setStyle(this.pageActions.last.buttonStyle).setLabel(this.pageActions.last.label).setDisabled(this.currentPageIndex === this.messageCores.length - 1));
                    }
                }
            }
        }
        return buttons;
    }

    /**
     * @param {object} options
     * @param {number} [options.oldIndex]
     * @param {number} options.newIndex
     * @param {boolean} [options.shouldApplyPageActions]
     */
    async _manageActions(options) {
        options = bindOptions({
            oldIndex: undefined,
            newIndex: 0,
            shouldApplyPageActions: false
        }, options);

        if (options.oldIndex !== undefined) {
            const oldPage = await this._getPage(options.oldIndex);
            oldPage.removeApply(this.sentMessage, { autoRemoveReaction: false, fastMode: false });
        }

        const newPage = await this._getPage(options.newIndex);
        newPage.apply(this.sentMessage, { autoReact: false });

        if (options.shouldApplyPageActions) {
            for (const action of this.enabledActions) {
                if (typeof action === "object" && action instanceof EmojiAction) {
                    // timeout is not necessary because the collector has timeout, 
                    // and the collector will remove this reaction after timeout.
                    action.apply(this.sentMessage, { autoReact: false });
                }
            }
        }
    }

    /**
     * Updates reactions at the sent MessagePages message for current page
     * @private
     */
    async _updateReactions() {

        // TODO: apply EmojiActions

        // TODO: remove unused EmojiActions

        const emojis = await this._getEmojis(this.currentPageIndex);

        // get all emojis that the client bot added to the sent message
        /** @type {MessageReaction[]} */
        const reactions = [...this.sentMessage.reactions.cache.filter(reaction => reaction.users.resolve(this.sentMessage.author.id)).values()];

        // remove reactions that are not in the emojis list (if all reactions aren't in the emojis list, remove all reactions)
        if (reactions.length > 0) {
            const currentEmojis = reactions.map(reaction => reaction.emoji.name);
            // same emojis, no need to update
            if (emojis.length === currentEmojis.length && currentEmojis.every((emoji, i) => emoji === emojis[i])) return;
            // remove all reactions
            await this.sentMessage.reactions.removeAll();
        }


        // add reactions that are not reacted yet
        for (const emoji of emojis) {
            await this.sentMessage.react(emoji);
        }

    }

    /**
     * Gets necessary emojis for the page
     * @private
     * @param {number} index
     * @returns {Promise<string[]>}
     */
    async _getEmojis(index) {
        const emojis = [];
        const messageCore = await this._getPage(index);
        emojis.push(...messageCore.getEmojis());
        emojis.push(...this._getMessagePagesEmojis());
        return emojis;
    }

    /** 
     * Gets necessary emojis for this MessagePages
     * @private
     * @returns {string[]}
     */
    _getMessagePagesEmojis() {
        const emojis = [];
        for (const emoji of this.enabledActions) {
            if (typeof emoji === "object" && emoji instanceof EmojiAction) {
                emojis.push(emoji.label);
            } else if (typeof emoji === "string" && !this.useButtons) {
                if (actionsList.includes(emoji)) {
                    if (emoji === "FIRST") {
                        emojis.push(this.pageActions.first.label);
                    } else if (emoji === "BACK") {
                        emojis.push(this.pageActions.back.label);
                    } else if (emoji === "NEXT") {
                        emojis.push(this.pageActions.next.label);
                    } else if (emoji === "LAST") {
                        emojis.push(this.pageActions.last.label);
                    }
                }
            }
        }
        return emojis;
    }

    /**
     * Gets system emojis for this MessagePages.
     * Such as "FIRST", "BACK", "NEXT", "LAST" emoji.
     * @private
     * @returns {string[]}
     */
    _getSystemEmojis() {
        const emojis = [];
        for (const emoji of this.enabledActions) {
            if (typeof emoji === "string" && !this.useButtons) {
                if (actionsList.includes(emoji)) {
                    if (emoji === "FIRST") {
                        emojis.push(this.pageActions.first.label);
                    } else if (emoji === "BACK") {
                        emojis.push(this.pageActions.back.label);
                    } else if (emoji === "NEXT") {
                        emojis.push(this.pageActions.next.label);
                    } else if (emoji === "LAST") {
                        emojis.push(this.pageActions.last.label);
                    }
                }
            }
        }
        return emojis;
    }

    /** 
     * Reaction collector for this MessagePages' emojis
     * @private
     */
    _activateReactionCollector() {
        const collector = this.sentMessage.createReactionCollector({
            filter: (reaction, user) => this.userFilter(user),
            time: this.timeout
        });

        collector.on("collect", async (reaction, user) => {
            // handle system emojis, not EmojiAction(s) in enabledActions

            // if the reaction is from the client bot, ignore it
            if (user.id === this.sentMessage.author.id) return;

            // if the reacted emoji is not the MessagePages' emojis, ignore it
            if (!this._getSystemEmojis().includes(reaction.emoji.name)) return;

            reaction.users.remove(user);
            if (reaction.emoji.name === this.pageActions.first.label) {
                await this.gotoPage(0);
            } else if (reaction.emoji.name === this.pageActions.back.label) {
                await this.gotoPage(Math.max(this.currentPageIndex - 1, 0));
            } else if (reaction.emoji.name === this.pageActions.next.label) {
                await this.gotoPage(Math.min(this.currentPageIndex + 1, this.messageCores.length - 1));
            } else if (reaction.emoji.name === this.pageActions.last.label) {
                await this.gotoPage(this.messageCores.length - 1);
            }
        });

        collector.on("end", (collected, reason) => {

            // remove MessagePages' reactions (system + extra), not the page's reactions.
            if (reason === "time") {
                const pageEmojis = this._getMessagePagesEmojis();
                if (this.sentMessage.reactions.cache.every(reaction => pageEmojis.includes(reaction.emoji.name))) {
                    this.sentMessage.reactions.removeAll();
                } else {
                    for (const emoji of pageEmojis) {
                        this.sentMessage.reactions.resolve(emoji)?.remove();
                    }
                }

                _deactivateEmojiActions();
            }
        });
    }

    _deactivateEmojiActions() {
        for (const emoji of this.enabledActions) {
            if (typeof emoji === "object" && emoji instanceof EmojiAction) {
                emoji.removeApply(this.sentMessage, { autoRemoveReaction: false });
            }
        }
    }
}