const { MessageReaction, Snowflake, User, Message } = require("discord.js");
const Core = require("../core/Core");
const { bindOptions } = require("../utils/utils");
const Action = require("./Action");

/** @extends {Action} */
module.exports = class EmojiAction extends Action {
    /**
     * @param {object} options 
     * @param {string} options.label
     * @param {Core} options.core
     * @param {(messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>} options.run
     */
    constructor(options) {
        super(options);

        if (!options.label) throw new Error("options.label is required.");
        if (!options.run) throw new Error("options.run is required.");

        /** @readonly @type {{label: string, core: Core, run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void> }} */
        this.options = options;
        /** @type {string} */
        this.label = this.options.label;
        /** @type {(messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>} */
        this.run = this.options.run;

        /** @readonly @type {boolean} */
        this.isEmojiAction = true;

        /** @readonly @type {Snowflake[]} */
        this.appliedMessages = [];

        /** @readonly @type {boolean} */
        this.deleted = false;
    }

    /**
     * @param {Message} message
     * @param {object} [options={}]
     * @param {number | null} [options.timeout=null]
     * @param {boolean} [options.autoReact=true]
     */
    async apply(message, options = {}) {
        options = bindOptions({ timeout: null, autoReact: true }, options)

        if (this.deleted) throw new Error("This emoji action has been deleted.");

        // if this action hasn't been registered to the core, register it
        if (!this.core.emojiActions.some(action => action.id === this.id)) {
            this.core.emojiActions.push(this);
        }


        if (options.autoReact) {
            // if the message doesn't have the reaction, add it
            if (!message.reactions.resolve(this.label)?.users?.resolve(this.core.client.user.id)) {
                await message.react(this.label);
            }
        }
        this.appliedMessages.push(message.id);

        if (options.timeout !== null) {
            setTimeout(() => {
                this.appliedMessages.splice(this.appliedMessages.indexOf(message.id), 1);
                if (message.reactions.resolve(this.label)?.users?.resolve(this.core.client.user.id)) {
                    message.reactions.resolve(this.label).users.remove(this.core.client.user);
                }
            }, options.timeout);
        }

    }

    /**
     * @param {Message} message
     * @param {object} [options={}]
     * @param {boolean} [options.autoRemoveReaction=true]
     */
    async removeApply(message, options = {}) {
        options = bindOptions({ autoRemoveReaction: true }, options)

        if (this.deleted) throw new Error("This emoji action has been deleted.");

        const index = this.appliedMessages.indexOf(message.id);
        if (index !== -1) {
            this.appliedMessages.splice(index, 1);
        }

        if (options.autoRemoveReaction) {
            if (message.reactions.resolve(this.label)?.users?.resolve(this.core.client.user.id)) {
                message.reactions.resolve(this.label).users.remove(this.core.client.user);
            }
        }
    }

    delete() {
        const index = this.core.emojiActions.findIndex(action => action.id === this.id);
        if (index !== -1) {
            this.core.emojiActions.splice(index, 1);
        }
        this.deleted = true;
    }
}