const { MessageSelectOptionData, MessageSelectMenu, SelectMenuInteraction } = require("discord.js");
const Action = require("./Action");
const { bindOptions } = require("../utils/utils");

/** @extends {Action} */
module.exports = class SelectMenuAction extends Action {
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
    constructor(options) {
        super(options);
        this.options = bindOptions({
            maxValues: 1,
            minValues: 1,
            options: [],
            disabled: false,
            run: async () => { }
        }, options);

        /** @type {number} */
        this.maxValues = this.options.maxValues;
        /** @type {number} */
        this.minValues = this.options.minValues;
        /** @readonly @type {MessageSelectOptionData[]} */
        this.options = this.options.options;
        /** @type {boolean} */
        this.disabled = this.options.disabled;
        /** @type {(interaction: SelectMenuInteraction) => Promise<void>} */
        this.run = this.options.run;

    }

    /** @returns {MessageSelectMenu} */
    getSelectMenu() {
        return new MessageSelectMenu()
            .setCustomId(`SELECT_MENU_ACTION:${this.id}`)
            .setPlaceholder(this.label)
            .setMaxValues(this.maxValues)
            .setMinValues(this.minValues)
            .setOptions(this.options)
            .setDisabled(this.disabled);
    }

    /**
     * @param {MessageSelectOptionData[]} options
     * @returns {SelectMenuAction}
     */
    addOptions(...options) {
        this.options.push(...options);
        return this;
    }

    /** 
     * @param {number} index
     * @param {number} deleteCount
     * @param {MessageSelectOptionData[]} options
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