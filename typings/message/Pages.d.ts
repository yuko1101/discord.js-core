export = Pages;
declare class Pages {
    /**
     * @param {MessageCore[]} messageCores
     * @param {object} [options={}]
     * @param {number} [options.startPage=0]
     * @param {object} [options.visuals={first: "⏪", back: "◀", forward: "▶", last: "⏩", shows: ["BACK", "FORWARD"]}]
     * @param {string} [options.visuals.first="⏪"]
     * @param {string} [options.visuals.back="◀"]
     * @param {string} [options.visuals.forward="▶"]
     * @param {string} [options.visuals.last="⏩"]
     * @param {("FIRST"|"BACK"|"FORWARD"|"LAST"|Action)[]} [options.visuals.shows=["BACK", "FORWARD"]]
     * @param {boolean} [options.useButtons=false]
     * @param {number | null} [options.timeout=null]
     * @param {(user: User) => boolean} [options.userFilter=(user) => true]
     */
    constructor(messageCores: MessageCore[], options?: {
        startPage?: number;
        visuals?: {
            first?: string;
            back?: string;
            forward?: string;
            last?: string;
            shows?: ("FIRST" | "BACK" | "FORWARD" | "LAST" | Action)[];
        };
        useButtons?: boolean;
        timeout?: number | null;
        userFilter?: (user: User) => boolean;
    });
    /** @readonly @type {MessageCore[]} */
    readonly messageCores: MessageCore[];
    /** @readonly */
    readonly options: any;
    /** @readonly @type {number} */
    readonly startPage: number;
    /** @readonly @type {{first: string, back: string, forward: string, last: string, shows: ("FIRST"|"BACK"|"FORWARD"|"LAST"|Action)[]}} */
    readonly visuals: {
        first: string;
        back: string;
        forward: string;
        last: string;
        shows: ("FIRST" | "BACK" | "FORWARD" | "LAST" | Action)[];
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
     * Sends the message pages to the channel
     * @param {TextBasedChannel} channel
     * @returns {Promise<Message>}
     */
    sendTo(channel: TextBasedChannel): Promise<Message>;
    /**
     * Sends the message pages as a reply of interaction
     * @param {Interaction} interaction
     * @param {object} [options={}]
     * @param {boolean} [options.followUp=false]
     * @param {boolean} [options.ephemeral=false]
     */
    interactionReply(interaction: Interaction, options?: {
        followUp?: boolean;
        ephemeral?: boolean;
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
     * @param {number} [page=this.currentPageIndex]
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
     * This function is used to get emojis which reacted at the message pages by the bot.
     * @private
     */
    private getPageEmojis;
    /**
     * This function is used to get emojis which is used to change the page.
     * @private
     */
    private getPageChangeEmojis;
    /**
     * @private
     */
    private removeUselessReactions;
}
import MessageCore = require("./MessageCore");
import Action = require("../action/Action");
import { User } from "discord.js";
import { Message } from "discord.js";
import { Interaction } from "discord.js";
import { TextBasedChannel } from "discord.js";
