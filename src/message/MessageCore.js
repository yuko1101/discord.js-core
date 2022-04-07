const { MessageActionRow, MessageOptions, Message, TextBasedChannel } = require("discord.js");
const ButtonAction = require("../action/ButtonAction");
const EmojiAction = require("../action/EmojiAction");
const { bindOptions } = require("../utils/utils");

const defaultData = {
    message: null,
    buttonActions: [],
    emojiActions: [],
}

module.exports = class MessageCore {
    /**
     * @param {object} data 
     * @param {MessageOptions} data.message
     * @param {ButtonAction[] | null} [data.buttonActions=[]]
     * @param {EmojiAction[] | null} [data.emojiActions[]]
     */
    constructor(data) {
        data = bindOptions(defaultData, data);
        /** @type {MessageOptions} */
        this.message = data.message;
        /** @type {ButtonAction[][]} */
        this.buttonActions = data.buttonActions.length !== 0 ? [data.buttonActions] : [];
        /** @type {EmojiAction[]} */
        this.emojiActions = data.emojiActions ?? [];
    }

    /** @returns {MessageActionRow[]} */
    getComponents() {
        const components = [];
        const buttonComponents = this.buttonActions.map(actions => {
            const row = new MessageActionRow();
            for (const action of actions) {
                row.addComponents(action.getButton());
            }
            return row;
        })

        components.push(...buttonComponents);
        return components;
    }

    /** @param {ButtonAction[]} buttonActions */
    addButtonsAsNewRow(buttonActions) {
        this.buttonActions.push(buttonActions);
    }


    /** @returns {MessageOptions} */
    getMessage() {
        const messageOptions = { ...this.message }; // make immutable
        const components = this.getComponents();
        messageOptions.components = [...(messageOptions.components ?? []), ...components];
        return messageOptions;
    }

    /** @returns {string[]} */
    getEmojis() {
        return this.emojiActions.map(action => action.label);
    }


    /** 
     * @param {Message} message
     * @param {object} [options={}]
     * @param {number | null} [options.timeout=null]
     * @param {boolean} [options.autoReact=true]
     */
    async apply(message, options = {}) {
        for (const action of this.emojiActions) {
            await action.apply(message, options);
        }
    }

    /**
     * @param {Message} message
     * @param {object} [options={}]
     * @param {boolean} [options.autoRemoveReaction=true]
     */
    async removeApply(message, options = {}) {
        for (const action of this.emojiActions) {
            await action.removeApply(message, options);
        }
    }

    /**
     * @param {TextBasedChannel} channel 
     * @param {object} [options={}]
     * @param {boolean} [options.autoApplyEmojiActions=true]
     * @returns {Promise<Message>}
     */
    async sendTo(channel, options = {}) {
        options = bindOptions({ autoApplyEmojiActions: true }, options);
        const message = await channel.send(this.getMessage());
        if (options.autoApplyEmojiActions) {
            for (const action of this.emojiActions) {
                await action.apply(message);
            }
        }
    }
}