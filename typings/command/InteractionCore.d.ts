export = InteractionCore;
declare class InteractionCore {
    /**
     * @param {Message | null} data.msg
     * @param {CommandInteraction | null} data.interaction
     */
    constructor(data: any);
    /** @type {Message | null} @readonly */
    readonly msg: Message | null;
    /** @type {CommandInteraction | null} @readonly */
    readonly interaction: CommandInteraction | null;
    /** @type {boolean} @readonly */
    readonly isSlashCommand: boolean;
    /** @type {TextBasedChannel} @readonly */
    readonly channel: TextBasedChannel;
    /** @type {Guild} @readonly */
    readonly guild: Guild;
    /** @type {GuildMember} @readonly */
    readonly member: GuildMember;
    /** @type {User} @readonly */
    readonly user: User;
    /** @type {Message | null} @readonly */
    readonly replyMessage: Message | null;
    /** @type {Message | null} @readonly */
    readonly followUpMessage: Message | null;
    /** @type {boolean} @readonly */
    readonly deferred: boolean;
    /** @type {boolean} @readonly */
    readonly replied: boolean;
    /** @type {boolean} @readonly */
    readonly followedUp: boolean;
    /** @type {boolean | null} @readonly */
    readonly isReplyMessageSentAsEphemeral: boolean | null;
    /** @type {boolean | null} @readonly */
    readonly isFollowUpMessageSentAsEphemeral: boolean | null;
    /** @type {boolean} @readonly */
    readonly isReplyMessageDeleted: boolean;
    /**
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (only for slash command)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (for message command, whether show the typing in the channel)
     */
    deferReply(options: {
        fetchReply: boolean;
        ephemeral: boolean;
    }): Promise<void>;
    /**
     * @param {MessageOptions} messageOptions
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (Only for slash command)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    reply(messageOptions: MessageOptions, options: {
        fetchReply: boolean;
        ephemeral: boolean;
    }): Promise<Message | null>;
    /**
     * @param {*} messageOptions
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    editReply(messageOptions: any, options: {
        fetchReply: boolean;
    }): Promise<Message | null>;
    /**
     * @param {object} options
     * @param {boolean} showError Whether to show the error stack trace while deleting the reply
     * @returns {boolean} Whether the reply message deleted successfully
     */
    deleteReply(options: object): boolean;
    /**
     * @param {MessageOptions} messageOptions
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (Only for slash command)
     * @param {boolean} options.reply Whether to reply to the previous message (Only for message command. If deferred the InteractionCore, this option is ignored)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    followUp(messageOptions: MessageOptions, options: {
        fetchReply: boolean;
        ephemeral: boolean;
        reply: boolean;
    }): Promise<Message | null>;
}
import { Message } from "discord.js";
import { CommandInteraction } from "discord.js";
import { TextBasedChannel } from "discord.js";
import { Guild } from "discord.js";
import { GuildMember } from "discord.js";
import { User } from "discord.js";
import { MessageOptions } from "discord.js";
