export = MessagePages;
declare class MessagePages {
    /**
     * @param {object} [options]
     * @param {(MessageCore | () => Promise<MessageCore>)[]} options.messageCores
     * @param {number} [options.startPageIndex]
     * @param {object} [options.pageActions]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.first]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.back]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.next]
     *  @param {{label?: string, buttonStyle?: MessageButtonStyleResolvable}} [options.pageActions.last]
     *  @param {SelectMenuAction} [options.pageActions.selectMenu]
     * @param {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} [options.enabledActions]
     * @param {"REACTION"|"BUTTON"|"SELECT_MENU"} [options.type]
     * @param {number} [options.timeout]
     * @param {(User) => Promise<boolean>} [options.userFilter]
     */
    constructor(options?: {
        messageCores: (MessageCore | (() => Promise<MessageCore>))[];
        startPageIndex?: number;
        pageActions?: {
            first?: {
                label?: string;
                buttonStyle?: MessageButtonStyleResolvable;
            };
            back?: {
                label?: string;
                buttonStyle?: MessageButtonStyleResolvable;
            };
            next?: {
                label?: string;
                buttonStyle?: MessageButtonStyleResolvable;
            };
            last?: {
                label?: string;
                buttonStyle?: MessageButtonStyleResolvable;
            };
            selectMenu?: SelectMenuAction;
        };
        enabledActions?: ("FIRST" | "BACK" | "NEXT" | "LAST" | Action)[];
        type?: "REACTION" | "BUTTON" | "SELECT_MENU";
        timeout?: number;
        userFilter?: (User: any) => Promise<boolean>;
    });
    /** @readonly @type {object} */
    readonly options: object;
    /** @readonly @type {(MessageCore | () => Promise<MessageCore>)[]} */
    readonly messageCores: (MessageCore | (() => Promise<MessageCore>))[];
    /** @readonly @type {number} */
    readonly startPageIndex: number;
    /** @readonly @type {{first: {label: string, buttonStyle: MessageButtonStyleResolvable}, back: {label: string, buttonStyle: MessageButtonStyleResolvable}, next: {label: string, buttonStyle: MessageButtonStyleResolvable}, last: {label: string, buttonStyle: MessageButtonStyleResolvable}}} */
    readonly pageActions: {
        first: {
            label: string;
            buttonStyle: MessageButtonStyleResolvable;
        };
        back: {
            label: string;
            buttonStyle: MessageButtonStyleResolvable;
        };
        next: {
            label: string;
            buttonStyle: MessageButtonStyleResolvable;
        };
        last: {
            label: string;
            buttonStyle: MessageButtonStyleResolvable;
        };
    };
    /** @readonly @type {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} */
    readonly enabledActions: ("FIRST" | "BACK" | "NEXT" | "LAST" | Action)[];
    /** @readonly @type {SelectMenuAction | null} */
    readonly selectMenu: SelectMenuAction | null;
    /** @readonly @type {"REACTION"|"BUTTON"|"SELECT_MENU"} */
    readonly type: "REACTION" | "BUTTON" | "SELECT_MENU";
    /** @readonly @type {number | null} */
    readonly timeout: number | null;
    /** @readonly @type {(User) => Promise<boolean>} */
    readonly userFilter: (User: any) => Promise<boolean>;
    /** @readonly @type {boolean} */
    readonly isSent: boolean;
    /** @readonly @type {Message | null} */
    readonly sentMessage: Message | null;
    /** @readonly @type {Interaction | null} */
    readonly interaction: Interaction | null;
    /** @readonly @type {number} */
    readonly currentPageIndex: number;
    /**
     * This function is available when the type is "SELECT_MENU"
     * @param {MessageSelectMenu} selectMenu
     * @returns {MessagePages}
     */
    setSelectMenu(selectMenu: MessageSelectMenu): MessagePages;
    /**
     * Sends this MessagePages message to the channel
     * @param {TextBasedChannel | Message} whereToSend
     * @returns {Promise<Message>}
     */
    sendTo(whereToSend: TextBasedChannel | Message): Promise<Message>;
    /**
     * Sends this MessagePages message as a reply of the interaction
     * @param {Interaction} interaction
     * @param {object} [options]
     * @param {boolean} [options.followUp]
     * @param {boolean} [options.ephemeral]
     * @returns {Promise<Message>}
     */
    interactionReply(interaction: Interaction, options?: {
        followUp?: boolean;
        ephemeral?: boolean;
    }): Promise<Message>;
    /**
     * @param {number} index
     */
    gotoPage(index: number): Promise<void>;
    /**
     * @private
     * @param {number} index
     * @returns {Promise<MessageOptions>}
     */
    private _getMessageOptionsWithComponents;
    /**
     * @private
     * @param {number} index
     * @returns {Promise<MessageCore>}
     */
    private _getPage;
    /**
     * Gets necessary buttons for this MessagePages
     * @private
     * @returns {MessageButton[]}
     */
    private _getButtons;
    /**
     * @private
     * @param {object} options
     * @param {number} [options.oldIndex]
     * @param {number} options.newIndex
     * @param {boolean} [options.shouldApplyPageActions]
     */
    private _manageActions;
    /**
     * Updates reactions at the sent MessagePages message for current page
     * @private
     */
    private _updateReactions;
    /**
     * Gets necessary emojis for the page
     * @private
     * @param {number} index
     * @returns {Promise<string[]>}
     */
    private _getEmojis;
    /**
     * Gets necessary emojis for this MessagePages
     * @private
     * @returns {string[]}
     */
    private _getMessagePagesEmojis;
    /**
     * Gets system emojis for this MessagePages.
     * Such as "FIRST", "BACK", "NEXT", "LAST" emoji.
     * @private
     * @returns {string[]}
     */
    private _getSystemEmojis;
    /**
     * Reaction collector for this MessagePages' emojis
     * @private
     */
    private _activateReactionCollector;
    /**
     * @private
     */
    private _activateInteractionCollector;
    /** @private */
    private _deactivateEmojiActions;
}
import MessageCore = require("./MessageCore");
import { MessageButtonStyleResolvable } from "discord.js";
import Action = require("../action/Action");
import SelectMenuAction = require("../action/SelectMenuAction");
import { Message } from "discord.js";
import { Interaction } from "discord.js";
import { MessageSelectMenu } from "discord.js";
import { TextBasedChannel } from "discord.js";
