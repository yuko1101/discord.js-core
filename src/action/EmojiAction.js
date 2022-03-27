const { MessageReaction, Snowflake, User, Message } = require("discord.js");
const Core = require("../core/Core");
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
    }

    /**
     * @param {Message} message
     */
    async apply(message) {
        // if this action hasn't been registered to the core, register it
        if (!this.core.emojiActions.some(action => action.id === this.id)) {
            this.core.emojiActions.push(this);
        }

        // if the message doesn't have the reaction, add it
        if (!message.reactions.cache.some(reaction => reaction.emoji.toString() === this.label)) {
            await message.react(this.label);
        }
        this.appliedMessages.push(message.id);
    }
}