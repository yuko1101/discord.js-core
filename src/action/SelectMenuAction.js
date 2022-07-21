const { SelectMenuOptionBuilder, SelectMenuBuilder, SelectMenuInteraction } = require("discord.js");
const Action = require("./Action");
const { bindOptions } = require("../utils/utils");

/** @extends {Action} */
module.exports = class SelectMenuAction extends Action {
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
    constructor(data) {
        super(data);
        this.data = bindOptions({
            core: null,
            label: "",
            maxValues: 1,
            minValues: 1,
            options: [],
            disabled: false,
            run: async () => { }
        }, data);

        /** @type {number} */
        this.maxValues = this.data.maxValues;
        /** @type {number} */
        this.minValues = this.data.minValues;
        /** @readonly @type {SelectMenuOptionBuilder[]} */
        this.options = this.data.options;
        /** @type {boolean} */
        this.disabled = this.data.disabled;
        /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
        this.run = this.data.run;

        /** @readonly @type {string} */
        this.customId = `SELECT_MENU_ACTION:${this.id}`;

    }

    /** @returns {SelectMenuBuilder} */
    getSelectMenu() {
        return new SelectMenuBuilder()
            .setCustomId(this.customId)
            .setPlaceholder(this.label)
            .setMaxValues(this.maxValues)
            .setMinValues(this.minValues)
            .setOptions(this.options)
            .setDisabled(this.disabled);
    }

    /**
     * @param {SelectMenuOptionBuilder[]} options
     * @returns {SelectMenuAction}
     */
    addOptions(...options) {
        this.options.push(...options);
        return this;
    }

    /** 
     * @param {number} index
     * @param {number} deleteCount
     * @param {SelectMenuOptionBuilder[]} options
     * @returns {SelectMenuAction}
     */
    spliceOptions(index, deleteCount, ...options) {
        this.options.splice(index, deleteCount, ...options);
        return this;
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