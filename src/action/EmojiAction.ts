import { Snowflake, User, MessageReaction, Message, PartialMessageReaction, PartialUser, PartialMessage } from "discord.js";
import { bindOptions } from "config_file.js";
import Action, { ActionOptions } from "./Action";

/** @typedef */
export interface EmojiActionOptions extends ActionOptions {
    readonly emoji: string;
    readonly run: (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, isReactionAdded: boolean) => Promise<void>;
}

/** @extends {Action} */
export default class EmojiAction extends Action {
    /**  */
    readonly options: EmojiActionOptions;
    /**  */
    readonly emoji: string;
    /**  */
    run: (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, isReactionAdded: boolean) => Promise<void>;

    /**  */
    readonly appliedMessages: Snowflake[];
    /**  */
    deleted: boolean;

    /**
     * @param options
     */
    constructor(options: EmojiActionOptions) {
        super(options);

        this.options = options;
        this.emoji = this.options.emoji;
        this.run = this.options.run;

        this.appliedMessages = [];

        this.deleted = false;
    }


    /**
     * @param message
     * @param options
     */
    async apply(message: Message | PartialMessage, options: { timeout?: number, autoReact?: boolean } = {}) {
        const opt = bindOptions({ autoReact: true }, options);

        if (this.deleted) throw new Error("This emoji action has been deleted.");

        // if this action hasn't been registered to the core, register this
        if (!this.core.emojiActions.includes(this)) {
            this.core.emojiActions.push(this);
        }

        if (opt.autoReact) {
            const core = await this.core.waitReady();
            // if the message doesn't have the reaction, add this reaction to it
            if (!message.reactions.resolve(this.emoji)?.users?.resolve(core.client.user.id)) {
                await message.react(this.emoji);
            }
        }
        this.appliedMessages.push(message.id);

        if (opt.timeout !== null) {
            setTimeout(async () => {
                this.appliedMessages.splice(this.appliedMessages.indexOf(message.id), 1);
                const resolvedEmoji = message.reactions.resolve(this.emoji);
                const core = await this.core.waitReady();
                if (resolvedEmoji?.users?.resolve(core.client.user.id)) {
                    resolvedEmoji.users.remove(core.client.user);
                }
            }, opt.timeout);
        }

    }

    /**
     * @param message
     * @param options
     */
    async removeApply(message: Message | PartialMessage, options: { autoRemoveReaction?: boolean } = {}) {
        const opt = bindOptions({ autoRemoveReaction: true }, options);

        if (this.deleted) throw new Error("This emoji action has been deleted.");

        const index = this.appliedMessages.indexOf(message.id);
        if (index !== -1) {
            this.appliedMessages.splice(index, 1);
        }

        if (opt.autoRemoveReaction) {
            const resolvedEmoji = message.reactions.resolve(this.emoji);
            const core = await this.core.waitReady();
            if (resolvedEmoji?.users?.resolve(core.client.user.id)) {
                resolvedEmoji.users.remove(core.client.user);
            }
        }
    }

    delete() {
        const index = this.core.emojiActions.indexOf(this);
        if (index !== -1) {
            this.core.emojiActions.splice(index, 1);
        }
        this.deleted = true;
    }
}