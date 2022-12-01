export = ButtonAction;
declare class ButtonAction extends Action {
    /**
     * @param {object} options
     * @param {string} options.label
     * @param {Core} options.core
     * @param {ButtonStyle} [options.style]
     * @param {boolean} [options.disabled]
     * @param {(interaction: ButtonInteraction) => Promise<void>} options.run
     */
    constructor(options: {
        label: string;
        core: Core;
        style?: ButtonStyle;
        disabled?: boolean;
        run: (interaction: ButtonInteraction) => Promise<void>;
    });
    /** @readonly @type {{label: string, core: Core, style: ButtonStyle, run: (interaction: ButtonInteraction) => Promise<void> }} */
    readonly options: {
        label: string;
        core: Core;
        style: ButtonStyle;
        run: (interaction: ButtonInteraction) => Promise<void>;
    };
    /** @type {string} */
    label: string;
    /** @type {ButtonStyle} */
    style: ButtonStyle;
    /** @type {(interaction: ButtonInteraction) => Promise<void>} */
    run: (interaction: ButtonInteraction) => Promise<void>;
    /** @readonly @type {string} */
    readonly customId: string;
    /** @readonly @type {boolean} */
    readonly isButtonAction: boolean;
    /** @returns {ButtonBuilder} */
    getButton(): ButtonBuilder;
    /** @returns {ButtonAction} */
    register(): ButtonAction;
    /** @returns {ButtonAction} */
    unregister(): ButtonAction;
}
import Action = require("./Action");
import Core = require("../core/Core");
import { ButtonStyle } from "discord-api-types/payloads/v10/channel";
import { ButtonInteraction } from "discord.js";
import { ButtonBuilder } from "discord.js";
