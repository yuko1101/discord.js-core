export = MessagePages;
declare class MessagePages {
    /**
     * @param {object} [options]
     * @param {(MessageCore | () => Promise<MessageCore>)[]} options.messageCores
     * @param {number} [options.startPageIndex]
     * @param {object} [options.pageActions]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.first]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.back]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.next]
     *  @param {{label?: string, buttonStyle?: ButtonStyle}} [options.pageActions.last]
     *  @param {SelectMenuAction} [options.pageActions.selectMenuAction]
     * @param {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} [options.enabledActions]
     * @param {"REACTION"|"BUTTON"|"SELECT_MENU"|"NONE"} [options.type]
     * @param {number} [options.timeout]
     * @param {boolean} [options.resetTimeoutTimerOnAction]
     * @param {(User) => Promise<boolean>} [options.userFilter]
     */
    constructor(options?: {
        messageCores: (MessageCore | (() => Promise<MessageCore>))[];
        startPageIndex?: number;
        pageActions?: {
            first?: {
                label?: string;
                buttonStyle?: ButtonStyle;
            };
            back?: {
                label?: string;
                buttonStyle?: ButtonStyle;
            };
            next?: {
                label?: string;
                buttonStyle?: ButtonStyle;
            };
            last?: {
                label?: string;
                buttonStyle?: ButtonStyle;
            };
            selectMenuAction?: SelectMenuAction;
        };
        enabledActions?: ("FIRST" | "BACK" | "NEXT" | "LAST" | Action)[];
        type?: "REACTION" | "BUTTON" | "SELECT_MENU" | "NONE";
        timeout?: number;
        resetTimeoutTimerOnAction?: boolean;
        userFilter?: (User: any) => Promise<boolean>;
    });
    /** @readonly @type {object} */
    readonly options: object;
    /** @readonly @type {(MessageCore | () => Promise<MessageCore>)[]} */
    readonly messageCores: (MessageCore | (() => Promise<MessageCore>))[];
    /** @readonly @type {number} */
    readonly startPageIndex: number;
    /** @readonly @type {{first: {label: string, buttonStyle: ButtonStyle}, back: {label: string, buttonStyle: ButtonStyle}, next: {label: string, buttonStyle: ButtonStyle}, last: {label: string, buttonStyle: ButtonStyle}}} */
    readonly pageActions: {
        first: {
            label: string;
            buttonStyle: ButtonStyle;
        };
        back: {
            label: string;
            buttonStyle: ButtonStyle;
        };
        next: {
            label: string;
            buttonStyle: ButtonStyle;
        };
        last: {
            label: string;
            buttonStyle: ButtonStyle;
        };
    };
    /** @readonly @type {("FIRST"|"BACK"|"NEXT"|"LAST"|Action)[]} */
    readonly enabledActions: ("FIRST" | "BACK" | "NEXT" | "LAST" | Action)[];
    /** @readonly @type {SelectMenuAction | null} */
    readonly selectMenuAction: SelectMenuAction | null;
    /** @readonly @type {"REACTION"|"BUTTON"|"SELECT_MENU"|"NONE"} */
    readonly type: "REACTION" | "BUTTON" | "SELECT_MENU" | "NONE";
    /** @readonly @type {number | null} */
    readonly timeout: number | null;
    /** @type {boolean} */
    resetTimeoutTimerOnAction: boolean;
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
    /** @readonly @type {boolean} */
    readonly isDestroyed: boolean;
    /** @readonly @type {InteractionCollector || null} */
    readonly interactionCollector: InteractionCollector<any>;
    /** @readonly @type {ReactionCollector || null} */
    readonly reactionCollector: ReactionCollector;
    /**
     * This function is available when the type is "SELECT_MENU"
     * @param {SelectMenuAction} selectMenuAction
     * @returns {MessagePages}
     */
    setSelectMenu(selectMenuAction: SelectMenuAction): MessagePages;
    /**
     * Sends this MessagePages message to the channel
     * @param {TextBasedChannel | Message} whereToSend
     * @param {object} [options]
     * @param {boolean} [options.edit] Whether to edit the message instead of sending a new one. (`Message` must be provided as the first argument)
     * @returns {Promise<Message>}
     */
    sendTo(whereToSend: TextBasedChannel | Message, options?: {
        edit?: boolean;
    }): Promise<Message>;
    /**
     * Sends this MessagePages message as a reply of the interaction
     * @param {Interaction} interaction
     * @param {object} [options]
     * @param {boolean} [options.followUp]
     * @param {boolean} [options.ephemeral]
     * @param {boolean} [options.edit] Whether to edit the message instead of sending a new one.
     * @returns {Promise<Message>}
     */
    interactionReply(interaction: Interaction, options?: {
        followUp?: boolean;
        ephemeral?: boolean;
        edit?: boolean;
    }): Promise<Message>;
    /**
     * @param {object} [options]
     * @param {boolean} [options.autoRemoveReaction]
     * @returns {Promise<void>}
     */
    destroy(options?: {
        autoRemoveReaction?: boolean;
    }): Promise<void>;
    /**
     * @param {number} index
     */
    gotoPage(index: number): Promise<void>;
    /**
     * @private
     * @param {number} index
     * @returns {Promise<MessageCreateOptions>}
     */
    private _getMessageCreateOptionsWithComponents;
    /**
     * @private
     * @param {number} index
     * @returns {Promise<MessageCore>}
     */
    private _getPage;
    /**
     * Gets necessary buttons for this MessagePages
     * @private
     * @returns {ButtonBuilder[]}
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
import { ButtonStyle } from "discord-api-types/payloads/v10/channel";
import Action = require("../action/Action");
import SelectMenuAction = require("../action/SelectMenuAction");
import { Message } from "discord.js";
import { Interaction } from "discord.js";
import { InteractionCollector } from "discord.js";
import { ReactionCollector } from "discord.js";
import { TextBasedChannel } from "discord.js";
