export = SelectMenuAction;
declare class SelectMenuAction extends Action {
    /**
     * @param {object} data
     * @param {Core} data.core
     * @param {BaseSelectMenuBuilder} data.selectMenu customId will be changed by this library
     * @param {(interaction: SelectMenuInteraction) => Promise<void>} data.run
     */
    constructor(data: {
        core: Core;
        selectMenu: BaseSelectMenuBuilder<any>;
        run: (interaction: SelectMenuInteraction) => Promise<void>;
    });
    data: any;
    /** @type {BaseSelectMenuBuilder} */
    selectMenu: BaseSelectMenuBuilder<any>;
    /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
    run: (interaction: SelectMenuInteraction) => Promise<void>;
    /** @readonly @type {string} */
    readonly customId: string;
    /** @returns {SelectMenuAction}  */
    register(): SelectMenuAction;
    /** @returns {SelectMenuAction} */
    unregister(): SelectMenuAction;
}
import Action = require("./Action");
import { BaseSelectMenuBuilder } from "@discordjs/builders";
import { SelectMenuInteraction } from "discord.js";
