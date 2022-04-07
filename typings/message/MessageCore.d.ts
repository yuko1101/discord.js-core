export = MessageCore;
declare class MessageCore {
    /**
     * @param {object} data
     * @param {MessageOptions} data.message
     * @param {ButtonAction[] | null} [data.buttonActions=[]]
     * @param {EmojiAction[] | null} [data.emojiActions[]]
     */
    constructor(data: {
        message: MessageOptions;
        buttonActions?: ButtonAction[] | null;
        emojiActions?: EmojiAction[] | null;
    });
    /** @type {MessageOptions} */
    message: MessageOptions;
    /** @type {ButtonAction[][]} */
    buttonActions: ButtonAction[][];
    /** @type {EmojiAction[]} */
    emojiActions: EmojiAction[];
    /** @returns {MessageActionRow[]} */
    getComponents(): MessageActionRow[];
    /** @param {ButtonAction[]} buttonActions */
    addButtonsAsNewRow(buttonActions: ButtonAction[]): void;
    /** @returns {MessageOptions} */
    getMessage(): MessageOptions;
    /** @returns {string[]} */
    getEmojis(): string[];
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
    /**
     * @param {TextBasedChannel} channel
     * @param {object} [options={}]
     * @param {boolean} [options.autoApplyEmojiActions=true]
     * @returns {Promise<Message>}
     */
    sendTo(channel: TextBasedChannel, options?: {
        autoApplyEmojiActions?: boolean;
    }): Promise<Message>;
}
import { MessageOptions } from "discord.js";
import ButtonAction = require("../action/ButtonAction");
import EmojiAction = require("../action/EmojiAction");
import { MessageActionRow } from "discord.js";
import { Message } from "discord.js";
import { TextBasedChannel } from "discord.js";
