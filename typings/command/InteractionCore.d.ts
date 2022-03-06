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
    readonly author: User;
}
import { Message } from "discord.js";
import { CommandInteraction } from "discord.js";
import { TextBasedChannel } from "discord.js";
import { Guild } from "discord.js";
import { GuildMember } from "discord.js";
import { User } from "discord.js";
