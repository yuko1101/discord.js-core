export = SelectMenuAction;
declare class SelectMenuAction extends Action {
    /**
     * @param {object} data
     * @param {string} data.label
     * @param {Core} data.core
     * @param {number} [data.maxValues]
     * @param {number} [data.minValues]
     * @param {MessageSelectOptionData[]} [data.options]
     * @param {boolean} [data.disabled]
     * @param {(interaction: SelectMenuInteraction) => Promise<void>} data.run
     */
    constructor(data: {
        label: string;
        core: Core;
        maxValues?: number;
        minValues?: number;
        options?: MessageSelectOptionData[];
        disabled?: boolean;
        run: (interaction: SelectMenuInteraction) => Promise<void>;
    });
    data: any;
    /** @type {number} */
    maxValues: number;
    /** @type {number} */
    minValues: number;
    /** @readonly @type {MessageSelectOptionData[]} */
    readonly options: MessageSelectOptionData[];
    /** @type {boolean} */
    disabled: boolean;
    /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
    run: (interaction: SelectMenuInteraction) => Promise<void>;
    /** @readonly @type {string} */
    readonly customId: string;
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
import { SelectMenuInteraction } from "discord.js";
