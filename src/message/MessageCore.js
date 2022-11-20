const { ActionRowBuilder, MessageCreateOptions, Message, TextBasedChannel, Interaction } = require("discord.js");
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
     * @param {MessageCreateOptions} data.message
     * @param {ButtonAction[] | null} [data.buttonActions=[]]
     * @param {EmojiAction[] | null} [data.emojiActions]
     */
    constructor(data) {
        data = bindOptions(defaultData, data);
        /** @type {MessageCreateOptions} */
        this.message = data.message;
        /** @type {ButtonAction[][]} */
        this.buttonActions = data.buttonActions.length !== 0 ? [data.buttonActions] : [];
        /** @type {EmojiAction[]} */
        this.emojiActions = data.emojiActions ?? [];
    }

    /** @returns {ActionRowBuilder[]} */
    getComponents() {
        const components = [];
        const buttonComponents = this.buttonActions.map(actions => {
            const row = new ActionRowBuilder();
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


    /** 
     * Get the complete message object to send.
     * @returns {MessageCreateOptions} 
     */
    getMessage() {
        const messageCreateOptions = { ...this.message }; // make immutable
        const components = this.getComponents();
        messageCreateOptions.components = [...(messageCreateOptions.components ?? []), ...components];
        return messageCreateOptions;
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
     * @param {boolean} [options.fastMode=false]
     */
    async removeApply(message, options = {}) {
        if (this.emojiActions.length === 0) return;
        const fastMode = options.fastMode ?? false;
        delete options.fastMode;
        if (fastMode) {
            await new Promise(resolve => {
                var count = 0;
                this.emojiActions.forEach(action => {
                    action.removeApply(message, options).then(() => {
                        count++;
                        if (count === this.emojiActions.length) resolve();
                    });
                });
            });
        } else {
            for (const action of this.emojiActions) {
                await action.removeApply(message, options);
            }
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

    /**
     * @param {Interaction} interaction
     * @param {object} [options={}]
     * @param {boolean} [options.autoApplyEmojiActions=true]
     * @param {boolean} [options.followUp=false]
     * @param {boolean} [options.ephemeral=false]
     * @param {boolean} [options.fetchReply=false]
     * @returns {Promise<Message | null>} Returns null if `fetchReply` is false
     */
    async interactionReply(interaction, options) {
        options = bindOptions({
            autoApplyEmojiActions: true,
            followUp: false,
            ephemeral: false,
            fetchReply: false
        }, options);
        if ((options.ephemeral || interaction.ephemeral) && this.emojiActions.length !== 0) {
            throw new Error("You cannot add reactons to ephemeral message.");
        }
        const messageCreateOptions = { ...this.getMessage(), fetchReply: options.fetchReply, ephemeral: options.ephemeral };
        const message = options.followUp ? await interaction.followUp(messageCreateOptions) : await interaction.reply(messageCreateOptions);
        this.buttonActions.forEach(array => array.forEach(action => action.register()));
        if (options.autoApplyEmojiActions) {
            await this.apply(message, { autoReact: true });
        }
        return message;
    }
}