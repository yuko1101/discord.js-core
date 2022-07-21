export = SelectMenuAction;
declare class SelectMenuAction extends Action {
    /**
     * @param {object} data
     * @param {string} data.label
     * @param {Core} data.core
     * @param {number} [data.maxValues]
     * @param {number} [data.minValues]
     * @param {SelectMenuOptionBuilder[]} [data.options]
     * @param {boolean} [data.disabled]
     * @param {(interaction: SelectMenuInteraction) => Promise<void>} data.run
     */
    constructor(data: {
        label: string;
        core: Core;
        maxValues?: number;
        minValues?: number;
        options?: SelectMenuOptionBuilder[];
        disabled?: boolean;
        run: (interaction: SelectMenuInteraction) => Promise<void>;
    });
    data: any;
    /** @type {number} */
    maxValues: number;
    /** @type {number} */
    minValues: number;
    /** @readonly @type {SelectMenuOptionBuilder[]} */
    readonly options: SelectMenuOptionBuilder[];
    /** @type {boolean} */
    disabled: boolean;
    /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
    run: (interaction: SelectMenuInteraction) => Promise<void>;
    /** @readonly @type {string} */
    readonly customId: string;
    /** @returns {SelectMenuBuilder} */
    getSelectMenu(): SelectMenuBuilder;
    /**
     * @param {SelectMenuOptionBuilder[]} options
     * @returns {SelectMenuAction}
     */
    addOptions(...options: SelectMenuOptionBuilder[]): SelectMenuAction;
    /**
     * @param {number} index
     * @param {number} deleteCount
     * @param {SelectMenuOptionBuilder[]} options
     * @returns {SelectMenuAction}
     */
    spliceOptions(index: number, deleteCount: number, ...options: SelectMenuOptionBuilder[]): SelectMenuAction;
    /** @returns {SelectMenuAction}  */
    register(): SelectMenuAction;
    /** @returns {SelectMenuAction} */
    unregister(): SelectMenuAction;
}
import Action = require("./Action");
import { SelectMenuOptionBuilder } from "discord.js";
import { SelectMenuInteraction } from "discord.js";
import { SelectMenuBuilder } from "discord.js";
