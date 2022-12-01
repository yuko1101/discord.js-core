export = EmojiAction;
declare class EmojiAction extends Action {
    /**
     * @param {object} options
     * @param {string} options.label
     * @param {Core} options.core
     * @param {(messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>} options.run
     */
    constructor(options: {
        label: string;
        core: Core;
        run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>;
    });
    /** @readonly @type {{label: string, core: Core, run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void> }} */
    readonly options: {
        label: string;
        core: Core;
        run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>;
    };
    /** @type {string} */
    label: string;
    /** @type {(messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>} */
    run: (messageReaction: MessageReaction, user: User, isReactionAdded: boolean) => Promise<void>;
    /** @readonly @type {boolean} */
    readonly isEmojiAction: boolean;
    /** @readonly @type {Snowflake[]} */
    readonly appliedMessages: Snowflake[];
    /** @readonly @type {boolean} */
    readonly deleted: boolean;
    /**
     * @param {Message} message
     * @param {object} [options={}]
     * @param {number | null} [options.timeout=null]
     * @param {boolean} [options.autoReact=true]
     */
    apply(message: Message, options?: {
        timeout?: number | null;
        autoReact?: boolean;
    }): Promise<void>;
    /**
     * @param {Message} message
     * @param {object} [options={}]
     * @param {boolean} [options.autoRemoveReaction=true]
     */
    removeApply(message: Message, options?: {
        autoRemoveReaction?: boolean;
    }): Promise<void>;
    delete(): void;
}
import Action = require("./Action");
import Core = require("../core/Core");
import { MessageReaction } from "discord.js";
import { User } from "discord.js";
import { Snowflake } from "discord.js";
import { Message } from "discord.js";
