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
    /** @readonly @type {TextBasedChannel} */
    readonly channel: TextBasedChannel;
    /** @readonly @type {Guild} */
    readonly guild: Guild;
    /** @readonly @type {GuildMember} */
    readonly member: GuildMember;
    /** @readonly @type {User} */
    readonly user: User;
    /** @readonly @type {Message | null} */
    readonly replyMessage: Message | null;
    /** @private @type {MessageCreateOptions | MessageCore | MessagePages} */
    private replyMessageData;
    /** @readonly @type {Message | null} */
    readonly followUpMessage: Message | null;
    /** @private @type {MessageCreateOptions | MessageCore | MessagePages} */
    private followUpMessageData;
    /** @readonly @type {boolean} */
    readonly deferred: boolean;
    /** @readonly @type {boolean} */
    readonly replied: boolean;
    /** @readonly @type {boolean} */
    readonly followedUp: boolean;
    /** @readonly @type {boolean | null} */
    readonly isReplyMessageSentAsEphemeral: boolean | null;
    /** @readonly @type {boolean | null} */
    readonly isFollowUpMessageSentAsEphemeral: boolean | null;
    /** @readonly @type {boolean} */
    readonly isReplyMessageDeleted: boolean;
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
     * @param {MessageCreateOptions | MessageCore | MessagePages} message
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    reply(message: MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
        ephemeral?: boolean;
    }): Promise<Message | null>;
    /**
     * @param {MessageCreateOptions | MessageCore | MessagePages} messageCreateOptions
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    editReply(messageCreateOptions: MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
    }): Promise<Message | null>;
    /**
     * @param {object} [options={}]
     * @param {boolean} [showError=false] Whether to show the error stack trace while deleting the reply
     * @returns {boolean} Whether the reply message deleted successfully
     */
    deleteReply(options?: object): boolean;
    /**
     * @param {MessageCreateOptions | MessageCore | MessagePages} message
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @param {boolean} [options.reply=true] Whether to reply to the previous message (Only for message command. If deferred the InteractionCore, this option is ignored)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    followUp(message: MessageCreateOptions | MessageCore | MessagePages, options?: {
        fetchReply?: boolean;
        ephemeral?: boolean;
        reply?: boolean;
    }): Promise<Message | null>;
}
import { Message } from "discord.js";
import { CommandInteraction } from "discord.js";
import { TextBasedChannel } from "discord.js";
import { Guild } from "discord.js";
import { GuildMember } from "discord.js";
import { User } from "discord.js";
import { MessageCreateOptions } from "discord.js";
import MessageCore = require("../message/MessageCore");
import MessagePages = require("../message/MessagePages");
