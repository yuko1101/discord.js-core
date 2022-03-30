const { MessageReaction, Snowflake, User, Message } = require("discord.js");
const Core = require("../core/Core");
const { bindOptions } = require("../utils/utils");
const Action = require("./Action");

module.exports = class EmojiAction extends Action {
    /**
     * @param {object} options 
     * @param {string} options.label
     * @param {Core} options.core
     * @param {(messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>} options.run
     */
    constructor(options) {
        super(options);

        if (!options.run) throw new Error("options.run is required.");

        /** @readonly @type {{label: string, core: Core, run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void> }} */
        this.options = options
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
     * @param {object} options
     * @param {number} options.timeout
     * @param {boolean} options.autoReact
     */
    async apply(message, options) {
        options = bindOptions({ timeout: -1, autoReact: true }, options)

        if (this.deleted) throw new Error("This emoji action has been deleted.");

        // if this action hasn't been registered to the core, register it
        if (!this.core.emojiActions.some(action => action.id === this.id)) {
            this.core.emojiActions.push(this);
        }


        if (options.autoReact) {
            // if the message doesn't have the reaction, add it
            if (!message.reactions.resolve(this.label)) {
                await message.react(this.label);
            }
        }
        this.appliedMessages.push(message.id);

        if (options.timeout !== -1) {
            setTimeout(() => {
                this.appliedMessages.splice(this.appliedMessages.indexOf(message.id), 1);
                if (message.reactions.resolve(this.label)?.users?.resolve(this.core.client.user.id)) {
                    message.reactions.resolve(this.label).users.remove(this.core.client.user);
                }
            }, options.timeout);
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