export = MessageCore;
declare class MessageCore {
    /**
     * @param {object} data
     * @param {MessageCreateOptions} data.message
     * @param {ButtonAction[] | null} [data.buttonActions=[]]
     * @param {EmojiAction[] | null} [data.emojiActions]
     */
    constructor(data: {
        message: MessageCreateOptions;
        buttonActions?: ButtonAction[] | null;
        emojiActions?: EmojiAction[] | null;
    });
    /** @type {MessageCreateOptions} */
    message: MessageCreateOptions;
    /** @type {ButtonAction[][]} */
    buttonActions: ButtonAction[][];
    /** @type {EmojiAction[]} */
    emojiActions: EmojiAction[];
    /** @returns {ActionRowBuilder[]} */
    getComponents(): ActionRowBuilder[];
    /** @param {ButtonAction[]} buttonActions */
    addButtonsAsNewRow(buttonActions: ButtonAction[]): void;
    /**
     * Get the complete message object to send.
     * @returns {MessageCreateOptions}
     */
    getMessage(): MessageCreateOptions;
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
     * @param {boolean} [options.fastMode=false]
     */
    removeApply(message: Message, options?: {
        autoRemoveReaction?: boolean;
        fastMode?: boolean;
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
    /**
     * @param {Interaction} interaction
     * @param {object} [options={}]
     * @param {boolean} [options.autoApplyEmojiActions=true]
     * @param {boolean} [options.followUp=false]
     * @param {boolean} [options.ephemeral=false]
     * @param {boolean} [options.fetchReply=false]
     * @returns {Promise<Message | null>} Returns null if `fetchReply` is false
     */
    interactionReply(interaction: Interaction, options?: {
        autoApplyEmojiActions?: boolean;
        followUp?: boolean;
        ephemeral?: boolean;
        fetchReply?: boolean;
    }): Promise<Message | null>;
}
import { MessageCreateOptions } from "discord.js";
import ButtonAction = require("../action/ButtonAction");
import EmojiAction = require("../action/EmojiAction");
import { ActionRowBuilder } from "discord.js";
import { Message } from "discord.js";
import { TextBasedChannel } from "discord.js";
import { Interaction } from "discord.js";
