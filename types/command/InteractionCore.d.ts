export = InteractionCore;
declare class InteractionCore {
    /**
     * @param {object} data
     * @param {Message | null} data.msg
     * @param {CommandInteraction | null} data.interaction
     */
    constructor(data: {
        msg: Message | null;
        interaction: CommandInteraction | null;
    });
    /** @readonly @type {Message | null} */
    readonly msg: Message | null;
    /** @readonly @type {CommandInteraction | null} */
    readonly interaction: CommandInteraction | null;
    /** @readonly @type {boolean} */
    readonly hasInteraction: boolean;
    /** @readonly @type {import("discord.js").TextBasedChannel} */
    readonly channel: import("discord.js").TextBasedChannel;
    /** @readonly @type {Guild} */
    readonly guild: Guild;
    /** @readonly @type {GuildMember | import("discord.js").APIInteractionGuildMember} */
    readonly member: GuildMember | import("discord.js").APIInteractionGuildMember;
    /** @readonly @type {User} */
    readonly user: User;
    /** @readonly @type {Date} */
    readonly createdAt: Date;
    /** @readonly @type {number} */
    readonly createdTimestamp: number;
    /** @readonly @type {string} */
    readonly id: string;
    /** @type {Message | null} */
    replyMessage: Message | null;
    /** @type {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} */
    replyMessageData: import("discord.js").MessageCreateOptions | MessageCore | MessagePages;
    /** @type {Message | null} */
    followUpMessage: Message | null;
    /** @type {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} */
    followUpMessageData: import("discord.js").MessageCreateOptions | MessageCore | MessagePages;
    /** @type {boolean} */
    deferred: boolean;
    /** @type {boolean} */
    replied: boolean;
    /** @type {boolean} */
    followedUp: boolean;
    /** @type {boolean | null} */
    isReplyMessageSentAsEphemeral: boolean | null;
    /** @type {boolean | null} */
    isFollowUpMessageSentAsEphemeral: boolean | null;
    /** @type {boolean} */
    isReplyMessageDeleted: boolean;
    /**
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=false] Whether to fetch the reply (only for slash command)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (for message command, whether show the typing in the channel)
     */
    deferReply(options?: {
        fetchReply?: boolean;
        ephemeral?: boolean;
    }): Promise<void>;
    /**
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} message
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    reply(message: import("discord.js").MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
        ephemeral?: boolean;
    }): Promise<Message | null>;
    /**
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} messageCreateOptions
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    editReply(messageCreateOptions: import("discord.js").MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
    }): Promise<Message | null>;
    /**
     * @param {object} [options={}]
     * @param {boolean} [options.showError=false] Whether to show the error stack trace while deleting the reply
     * @returns {Promise<boolean>} Whether the reply message deleted successfully
     */
    deleteReply(options?: {
        showError?: boolean;
    }): Promise<boolean>;
    /**
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} message
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @param {boolean} [options.reply=true] Whether to reply to the previous message (Only for message command. If deferred the InteractionCore, this option is ignored)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    followUp(message: import("discord.js").MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
        ephemeral?: boolean;
        reply?: boolean;
    }): Promise<Message | null>;
}
import { Message } from "discord.js";
import { CommandInteraction } from "discord.js";
import { Guild } from "discord.js";
import { GuildMember } from "discord.js";
import { User } from "discord.js";
import MessageCore = require("../message/MessageCore");
import MessagePages = require("../message/MessagePages");
