export = SelectMenuAction;
declare class SelectMenuAction extends Action {
    /**
     * @param {object} options
     * @param {string} options.label
     * @param {Core} options.core
     * @param {number} [options.maxValues]
     * @param {number} [options.minValues]
     * @param {MessageSelectOptionData[]} [options.options]
     * @param {boolean} [options.disabled]
     * @param {(interaction: SelectMenuInteraction) => Promise<void>} options.run
     */
    constructor(options: {
        label: string;
        core: Core;
        maxValues?: number;
        minValues?: number;
        options?: MessageSelectOptionData[];
        disabled?: boolean;
        run: (interaction: SelectMenuInteraction) => Promise<void>;
    });
    options: MessageSelectOptionData[];
    /** @type {number} */
    maxValues: number;
    /** @type {number} */
    minValues: number;
    /** @type {boolean} */
    disabled: boolean;
    /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
    run: (interaction: SelectMenuInteraction) => Promise<void>;
    /** @returns {MessageSelectMenu} */
    getSelectMenu(): MessageSelectMenu;
    /**
     * @param {MessageSelectOptionData[]} options
     * @returns {SelectMenuAction}
     */
    addOptions(...options: MessageSelectOptionData[]): SelectMenuAction;
    /**
     * @param {number} index
     * @param {number} deleteCount
     * @param {MessageSelectOptionData[]} options
     * @returns {SelectMenuAction}
     */
    spliceOptions(index: number, deleteCount: number, ...options: MessageSelectOptionData[]): SelectMenuAction;
    /** @returns {SelectMenuAction}  */
    register(): SelectMenuAction;
    /** @returns {SelectMenuAction} */
    unregister(): SelectMenuAction;
}
import Action = require("./Action");
import { MessageSelectOptionData } from "discord.js";
import { SelectMenuInteraction } from "discord.js";
import { MessageSelectMenu } from "discord.js";
