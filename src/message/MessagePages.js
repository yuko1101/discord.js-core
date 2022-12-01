const { Message, TextBasedChannel, MessageCreateOptions, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageReaction, Interaction, InteractionCollector, ReactionCollector } = require("discord.js");
const ButtonAction = require("../action/ButtonAction");
const Action = require("../action/Action");
const { bindOptions } = require("../utils/utils");
const MessageCore = require("./MessageCore");
const EmojiAction = require("../action/EmojiAction");
const SelectMenuAction = require("../action/SelectMenuAction");

const actionsList = ["FIRST", "BACK", "NEXT", "LAST"];

const interactionActions = ["BUTTON", "SELECT_MENU"];

const defaultOptions = {
    messageCores: [],
    startPageIndex: 0,
    pageActions: {
        first: {
            label: "⏪",
            buttonStyle: ButtonStyle.Primary,
        },
        back: {
            label: "◀",
            buttonStyle: ButtonStyle.Primary,
        },
        next: {
            label: "▶",
            buttonStyle: ButtonStyle.Primary,
        },
        last: {
            label: "⏩",
            buttonStyle: ButtonStyle.Primary,
        },
        selectMenuAction: null
    },
    enabledActions: ["BACK", "NEXT"],
    type: "BUTTON",
    timeout: null,
    resetTimeoutTimerOnAction: false,
    userFilter: (user) => true
};

module.exports = class MessagePages {
    /**
     * @param {object} [options]
     * @param {(MessageCore | () => Promise<MessageCore>)[]} options.messageCores
     * @param {number} [options.startPageIndex]
     * @param {object} [options.pageActions]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.first]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.back]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.next]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.last]
     *  @param {SelectMenuAction} [options.pageActions.selectMenuAction]
     * @param {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} [options.enabledActions]
     * @param {"REACTION"|"BUTTON"|"SELECT_MENU"|"NONE"} [options.type]
     * @param {number} [options.timeout]
     * @param {boolean} [options.resetTimeoutTimerOnAction]
     * @param {(User) => Promise<boolean>} [options.userFilter]
     */
    constructor(options) {
        /** @readonly @type {object} */
        this.options = bindOptions(defaultOptions, options);
        /** @readonly @type {(MessageCore | () => Promise<MessageCore>)[]} */
        this.messageCores = this.options.messageCores;
        if (this.messageCores.length === 0) {
            throw new Error("MessageCores cannot be empty");
        }
        /** @readonly @type {number} */
        this.startPageIndex = this.options.startPageIndex;
        /** @readonly @type {{first: {label: string, buttonStyle: ButtonStyle}, back: {label: string, buttonStyle: ButtonStyle}, next: {label: string, buttonStyle: ButtonStyle}, last: {label: string, buttonStyle: ButtonStyle}}} */
        this.pageActions = this.options.pageActions;
        /** @readonly @type {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} */
        this.enabledActions = this.options.enabledActions;
        /** @readonly @type {SelectMenuAction | null} */
        this.selectMenuAction = this.options.pageActions.selectMenuAction;
        /** @readonly @type {"REACTION"|"BUTTON"|"SELECT_MENU"|"NONE"} */
        this.type = this.options.type;
        /** @readonly @type {number | null} */
        this.timeout = this.options.timeout;
        /** @type {boolean} */
        this.resetTimeoutTimerOnAction = this.options.resetTimeoutTimerOnAction;
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

        /** @readonly @type {boolean} */
        this.isDestroyed = false;

        /** @readonly @type {InteractionCollector || null} */
        this.interactionCollector = null;
        /** @readonly @type {ReactionCollector || null} */
        this.reactionCollector = null;
    }

    /**
     * This function is available when the type is "SELECT_MENU"
     * @param {SelectMenuAction} selectMenuAction
     * @returns {MessagePages}
     */
    setSelectMenu(selectMenuAction) {
        if (this.type !== "SELECT_MENU") throw new Error("This function is only available when the type is \"SELECT_MENU\"");
        this.options.selectMenuAction = selectMenuAction;
        this.selectMenuAction = selectMenuAction;
        return this;
    }

    /**
     * Sends this MessagePages message to the channel
     * @param {TextBasedChannel | Message} whereToSend
     * @param {object} [options]
     * @param {boolean} [options.edit] Whether to edit the message instead of sending a new one. (`Message` must be provided as the first argument)
     * @returns {Promise<Message>}
     */
    async sendTo(whereToSend, options = {}) {
        if (this.isDestroyed) throw new Error("This MessagePages has been destroyed");
        if (this.isSent) throw new Error("This MessagePages has already been sent.");
        if (this.type === "SELECT_MENU" && !this.selectMenuAction) throw new Error("Select menu type requires a select menu to be specified in the pageActions. Set pageActions.selectMenuAction to a SelectMenuAction before sending.");

        options = bindOptions({ edit: false }, options);

        if (options.edit && !whereToSend.reply) throw new Error("`whereToSend` must be a Message when editing.");

        const sendFunction = async (messageCreateOptions) => {
            if (options.edit) return await whereToSend.edit(messageCreateOptions);
            return await (whereToSend.reply ? whereToSend.reply(messageCreateOptions) : whereToSend.send(messageCreateOptions));
        }

        // send message
        this.sentMessage = await sendFunction(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));
        this.isSent = true;

        // apply reactions
        this._manageActions({ newIndex: this.currentPageIndex, shouldApplyPageActions: true });
        this._updateReactions();

        this._activateReactionCollector();
        this._activateInteractionCollector();

    }

    /**
     * Sends this MessagePages message as a reply of the interaction
     * @param {Interaction} interaction
     * @param {object} [options]
     * @param {boolean} [options.followUp]
     * @param {boolean} [options.ephemeral]
     * @param {boolean} [options.edit] Whether to edit the message instead of sending a new one.
     * @returns {Promise<Message>}
     */
    async interactionReply(interaction, options = {}) {
        if (this.isDestroyed) throw new Error("This MessagePages has been destroyed");
        if (interaction === null || interaction === undefined) throw new Error("Interaction cannot be null or undefined");
        options = bindOptions({
            followUp: false,
            ephemeral: false,
            edit: false
        }, options);

        if (this.isSent) throw new Error("This MessagePages has already been sent.");
        if (this.type === "SELECT_MENU" && !this.selectMenuAction) throw new Error("Select menu type requires a select menu to be specified in the pageActions. Set pageActions.selectMenu to a SelectMenuAction before sending.");

        if ((interaction.ephemeral || options.ephemeral) && (this.type === "REACTION" || this.enabledActions.some(action => typeof action === "object" && action instanceof EmojiAction))) {
            throw new Error("Ephemeral messages cannot have reactions.");
        }

        if (!options.followUp && !interaction.isRepliable()) {
            throw new Error("Interaction must be repliable. Please check the interaction is repliable interaction.");
        }
        if (options.followUp && !interaction.followUp) {
            throw new Error("Interaction must have the followUp() function. Please check the interaction is followUpable.");
        }

        const params = { ...(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex)), fetchReply: true, ephemeral: options.ephemeral };
        this.sentMessage = options.followUp ? await interaction.followUp(params)
            : options.edit ? await interaction.editReply(params)
                : await interaction.reply(params);
        this.isSent = true;
        this.interaction = interaction;

        this._manageActions({ newIndex: this.currentPageIndex, shouldApplyPageActions: true });
        this._updateReactions();

        if (!interaction.ephemeral && !options.ephemeral) this._activateReactionCollector();
        this._activateInteractionCollector();
    }

    /**
     * @param {object} [options]
     * @param {boolean} [options.autoRemoveReaction]
     * @returns {Promise<void>}
     */
    async destroy(options) {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (!this.isSent) return;

        options = bindOptions({ autoRemoveReaction: false }, options);

        (await this._getPage(this.currentPageIndex)).removeApply(this.sentMessage, options);
        /** @type {EmojiAction[]} */
        const emojiActions = this.enabledActions.filter(action => typeof action === "object" && action instanceof EmojiAction);
        emojiActions.forEach(action => action.removeApply(this.sentMessage));
    }

    /**
     * @param {number} index 
     */
    async gotoPage(index) {
        if (this.isDestroyed) throw new Error("This MessagePages has already been destroyed.");
        if (!this.isSent) throw new Error("This MessagePages hasn't been sent yet. Please send it first.");
        if (index < 0 || index >= this.messageCores.length) throw new Error("Index out of bounds");

        const oldIndex = this.currentPageIndex;
        this.currentPageIndex = index;

        if (this.sentMessage) {
            await this.sentMessage.edit(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));
        } else {
            if (!this.interaction.isRepliable()) throw new Error("Interaction must be repliable. Please check the interaction is repliable interaction.");
            await this.interaction.editReply(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));
        }
        this._manageActions({ oldIndex: oldIndex, newIndex: this.currentPageIndex });
        this._updateReactions();
    }

    /** 
     * @private
     * @param {number} index
     * @returns {Promise<MessageCreateOptions>}
     */
    async _getMessageCreateOptionsWithComponents(index) {
        const buttons = this._getButtons();
        const messageCreateOptions = { ...(await this._getPage(index)).getMessage() }; // make immutable
        if (buttons.length > 0) {
            messageCreateOptions.components = [...(messageCreateOptions.components || []), new ActionRowBuilder().addComponents(...buttons)];
        }
        if (this.type === "SELECT_MENU") {
            messageCreateOptions.components.push(new ActionRowBuilder().addComponents(this.selectMenuAction.selectMenu));
        }
        return messageCreateOptions;
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
     * @returns {ButtonBuilder[]}
     */
    _getButtons() {
        const buttons = [];
        for (const action of this.enabledActions) {
            if (typeof action === "object" && action instanceof ButtonAction) {
                buttons.push(action.getButton());
            } else if (typeof action === "string" && this.type === "BUTTON") {
                if (actionsList.includes(action)) {
                    if (action === "FIRST") {
                        buttons.push(new ButtonBuilder().setCustomId("DISCORD_CORE_MESSAGE_PAGES_FIRST").setStyle(this.pageActions.first.buttonStyle).setLabel(this.pageActions.first.label).setDisabled(this.currentPageIndex === 0));
                    } else if (action === "BACK") {
                        buttons.push(new ButtonBuilder().setCustomId("DISCORD_CORE_MESSAGE_PAGES_BACK").setStyle(this.pageActions.back.buttonStyle).setLabel(this.pageActions.back.label).setDisabled(this.currentPageIndex === 0));
                    } else if (action === "NEXT") {
                        buttons.push(new ButtonBuilder().setCustomId("DISCORD_CORE_MESSAGE_PAGES_NEXT").setStyle(this.pageActions.next.buttonStyle).setLabel(this.pageActions.next.label).setDisabled(this.currentPageIndex === this.messageCores.length - 1));
                    } else if (action === "LAST") {
                        buttons.push(new ButtonBuilder().setCustomId("DISCORD_CORE_MESSAGE_PAGES_LAST").setStyle(this.pageActions.last.buttonStyle).setLabel(this.pageActions.last.label).setDisabled(this.currentPageIndex === this.messageCores.length - 1));
                    }
                }
            }
        }
        return buttons;
    }

    /**
     * @private
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
                if (typeof action === "object") {
                    if (action instanceof EmojiAction) {
                        // timeout is not necessary because the collector has timeout, 
                        // and the collector will remove this reaction after timeout.
                        action.apply(this.sentMessage, { autoReact: false });
                    } else if (action instanceof ButtonAction) {
                        action.register();
                    }
                }

            }
            if (this.type === "SELECT_MENU") this.selectMenuAction.register();
        }
    }

    /**
     * Updates reactions at the sent MessagePages message for current page
     * @private
     */
    async _updateReactions() {


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
            } else if (typeof emoji === "string" && this.type === "REACTION") {
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
            if (typeof emoji === "string" && this.type === "REACTION") {
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
        this.reactionCollector = this.sentMessage.createReactionCollector({
            filter: (reaction, user) => this.userFilter(user),
            time: this.timeout
        });

        this.reactionCollector.on("collect", async (reaction, user) => {
            // handle system emojis, not EmojiAction(s) in enabledActions

            if (this.isDestroyed) return;
            if (this.type !== "REACTION") return;

            // if the reaction is from the client bot, ignore it
            if (user.id === this.sentMessage.author.id) return;

            // if the reacted emoji is not the MessagePages' emojis, ignore it
            if (!this._getSystemEmojis().includes(reaction.emoji.name)) return;

            if (this.resetTimeoutTimerOnAction) this.reactionCollector.resetTimer();

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

        this.reactionCollector.on("end", (collected, reason) => {
            if (this.isDestroyed) return;

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

                this._deactivateEmojiActions();
            }
        });
    }

    /**
     * @private
     */
    _activateInteractionCollector() {
        if (!interactionActions.includes(this.type)) return;

        this.interactionCollector = this.sentMessage.createMessageComponentCollector({
            filter: (interaction) => this.userFilter(interaction.user),
            time: this.timeout
        });

        this.interactionCollector.on("collect", async (interaction) => {
            if (this.isDestroyed) return;
            if (!interaction.isButton()) return;
            const id = interaction.customId;
            if (!id.startsWith("DISCORD_CORE_MESSAGE_PAGES_")) return;
            const pageIndex = id === "DISCORD_CORE_MESSAGE_PAGES_FIRST" ? 0
                : id === "DISCORD_CORE_MESSAGE_PAGES_BACK" ? Math.max(this.currentPageIndex - 1, 0)
                    : id === "DISCORD_CORE_MESSAGE_PAGES_NEXT" ? Math.min(this.currentPageIndex + 1, this.messageCores.length - 1)
                        : id === "DISCORD_CORE_MESSAGE_PAGES_LAST" ? this.messageCores.length - 1 : -1;
            if (pageIndex === -1) return;

            if (this.resetTimeoutTimerOnAction) this.interactionCollector.resetTimer();

            await interaction.deferUpdate();
            await this.gotoPage(pageIndex);
        });

        this.interactionCollector.on("end", async (collected, reason) => {
            if (this.isDestroyed) return;

            if (reason === "time") {
                const currentPage = await this._getPage(this.currentPageIndex);
                const message = currentPage.getMessage();
                const messageCreateOptions = { ...message, components: message.components ?? [] };
                if (this.sentMessage) {
                    await this.sentMessage.edit(messageCreateOptions);
                } else {
                    if (!this.interaction.isRepliable()) throw new Error("Interaction must be repliable. Please check the interaction is repliable interaction.");
                    await this.interaction.editReply(messageCreateOptions);
                }
            }
        });
    }

    /** @private */
    _deactivateEmojiActions() {
        for (const emoji of this.enabledActions) {
            if (typeof emoji === "object" && emoji instanceof EmojiAction) {
                emoji.removeApply(this.sentMessage, { autoRemoveReaction: false });
            }
        }
    }
}