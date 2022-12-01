const { ButtonInteraction, ButtonBuilder, ButtonStyle } = require("discord.js");
const Action = require("./Action");
const Core = require("../core/Core");

/** @extends {Action} */
module.exports = class ButtonAction extends Action {
    /**
     * @param {object} options 
     * @param {string} options.label
     * @param {Core} options.core
     * @param {ButtonStyle} [options.style]
     * @param {boolean} [options.disabled]
     * @param {(interaction: ButtonInteraction) => Promise<void>} options.run
     */
    constructor(options) {
        super(options);

        if (!options.label) throw new Error("options.label is required.");
        if (!options.run) throw new Error("options.run is required.");

        /** @readonly @type {{label: string, core: Core, style: ButtonStyle, run: (interaction: ButtonInteraction) => Promise<void> }} */
        this.options = options;
        /** @type {string} */
        this.label = this.options.label;
        /** @type {ButtonStyle} */
        this.style = this.options.style || ButtonStyle.Primary;

        /** @type {(interaction: ButtonInteraction) => Promise<void>} */
        this.run = this.options.run;

        /** @readonly @type {string} */
        this.customId = `BUTTON_ACTION${this.core.options.debug ? "-debug" : ""}:${this.id}`;

        /** @readonly @type {boolean} */
        this.isButtonAction = true;
    }

    /** @returns {ButtonBuilder} */
    getButton() {
        return new ButtonBuilder().setCustomId(this.customId).setStyle(this.style).setLabel(this.label);
    }

    /** @returns {ButtonAction} */
    register() {
        if (!this.core.buttonActions.some(action => action.id === this.id)) {
            this.core.buttonActions.push(this);
        }
        return this;
    }

    /** @returns {ButtonAction} */
    unregister() {
        const index = this.core.buttonActions.findIndex(action => action.id === this.id);
        if (index !== -1) {
            this.core.buttonActions.splice(index, 1);
        }
        return this;
    }
}