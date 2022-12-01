const { SelectMenuInteraction, BaseSelectMenuBuilder } = require("discord.js");
const Action = require("./Action");
const { bindOptions } = require("../utils/utils");

/** @extends {Action} */
module.exports = class SelectMenuAction extends Action {
    /** 
     * @param {object} data
     * @param {Core} data.core
     * @param {BaseSelectMenuBuilder} data.selectMenu customId will be changed by this library
     * @param {(interaction: SelectMenuInteraction) => Promise<void>} data.run
     */
    constructor(data) {
        super(data);
        this.data = bindOptions({
            core: null,
            selectMenu: null,
            run: async () => { }
        }, data);

        /** @type {BaseSelectMenuBuilder} */
        this.selectMenu = this.data.selectMenu;

        /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
        this.run = this.data.run;

        /** @readonly @type {string} */
        this.customId = `SELECT_MENU_ACTION${this.core.options.debug ? "-debug" : ""}:${this.id}`;

        this.selectMenu.setCustomId(this.customId);

    }

    /** @returns {SelectMenuAction}  */
    register() {
        if (!this.core.selectMenuActions.some(action => action.id === this.id)) {
            this.core.selectMenuActions.push(this);
        }
        return this;
    }

    /** @returns {SelectMenuAction} */
    unregister() {
        const index = this.core.selectMenuActions.findIndex(action => action.id === this.id);
        if (index !== -1) {
            this.core.selectMenuActions.splice(index, 1);
        }
        return this;
    }

}