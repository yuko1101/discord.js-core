export = Pages;
declare class Pages {
    /**
     * @param {Array<[MessageOptions | () => Promise<MessageOptions>]>} messages
     * @param {object} options
     * @param {number} options.startPage
     * @param {object} options.visuals
     * @param {string} options.visuals.first
     * @param {string} options.visuals.back
     * @param {string} options.visuals.forward
     * @param {string} options.visuals.last
     * @param {Array<["FIRST"|"BACK"|"FORWARD"|"LAST"|Action]>} options.visuals.shows
     * @param {boolean} options.useButtons
     * @param {number} options.timeout
     * @param {(user: User) => boolean} options.userFilter
     */
    constructor(messages: Array<[MessageOptions | (() => Promise<MessageOptions>)]>, options?: {
        startPage: number;
        visuals: {
            first: string;
            back: string;
            forward: string;
            last: string;
            shows: Array<["FIRST" | "BACK" | "FORWARD" | "LAST" | Action]>;
        };
        useButtons: boolean;
        timeout: number;
        userFilter: (user: User) => boolean;
    });
    /** @readonly @type {Array<[MessageOptions | () => Promise<MessageOptions>]>} */
    readonly messages: [MessageOptions | (() => Promise<MessageOptions>)][];
    /** @readonly */
    readonly options: any;
    /** @readonly @type {number} */
    readonly startPage: number;
    /** @readonly @type {{first: string, back: string, forward: string, last: string, shows: Array<["FIRST"|"BACK"|"FORWARD"|"LAST"|Action]>}} */
    readonly visuals: {
        first: string;
        back: string;
        forward: string;
        last: string;
        shows: Array<["FIRST" | "BACK" | "FORWARD" | "LAST" | Action]>;
    };
    /** @readonly @type {boolean} */
    readonly useButtons: boolean;
    /** @readonly @type {number} */
    readonly timeout: number;
    /** @readonly @type {(user: User) => boolean} */
    readonly userFilter: (user: User) => boolean;
    /** @readonly @type {boolean} */
    readonly isSent: boolean;
    /** @readonly @type {Message | null} */
    readonly sentMessage: Message | null;
    /** @readonly @type {Interaction | null} */
    readonly interaction: Interaction | null;
    /** @readonly @type {number} */
    readonly currentPageIndex: number;
    /**
     * @description Sends the message pages to the channel
     * @param {TextBasedChannel} channel
     * @returns {Promise<Message>}
     */
    sendTo(channel: TextBasedChannel): Promise<Message>;
    /**
     * @description Sends the message pages as a reply of interaction
     * @param {Interaction} interaction
     * @param {object} options
     * @param {boolean} options.followUp
     * @param {boolean} options.ephemeral
     */
    reply(interaction: Interaction, options: {
        followUp: boolean;
        ephemeral: boolean;
    }): Promise<void>;
    nextPage(): Promise<void>;
    previousPage(): Promise<void>;
    /**
     * @private
     * @param {number} page
     * @returns {Promise<MessageOptions>}
     */
    private getMessageOptionsWithButtons;
    /**
     * @private
     */
    private collectInteraction;
    /**
     * @private
     * @param {number} page
     * @returns {Promise<MessageOptions>}
     */
    private getPage;
    /**
     * @private
     */
    private collectReactions;
    /**
     * @private
     */
    private setupReactions;
    /**
     * @private
     * @description This function is used to get emojis which reacted at the message pages by the bot.
     */
    private getPageEmojis;
}
import { MessageOptions } from "discord.js";
import Action = require("../action/Action");
import { User } from "discord.js";
import { Message } from "discord.js";
import { Interaction } from "discord.js";
import { TextBasedChannel } from "discord.js";
