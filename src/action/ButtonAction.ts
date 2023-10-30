import { ButtonInteraction, ButtonStyle, ButtonBuilder } from "discord.js";
import Action, { ActionOptions } from "./Action";
import { devModeCommandPrefix } from "../core/commandManager";

/** @typedef */
export interface ButtonActionOptions extends ActionOptions {
    readonly label: string;
    readonly customId: string;
    readonly run: (interaction: ButtonInteraction) => Promise<void>;
    readonly style?: ButtonStyle;
}

/** @extends {Action} */
export default class ButtonAction extends Action {
    /**  */
    readonly options: ButtonActionOptions;
    /**  */
    readonly label: string;
    /**  */
    readonly style: ButtonStyle;
    /**  */
    run: (interaction: ButtonInteraction) => Promise<void>;
    /**  */
    readonly customId: string;

    /**
     * @param options
     */
    constructor(options: ButtonActionOptions) {
        super(options);

        this.options = options;
        this.label = this.options.label;
        this.style = this.options.style ?? ButtonStyle.Primary;

        this.run = this.options.run;

        this.customId = `${this.core.options.devMode ? devModeCommandPrefix : ""}${this.options.customId}`;
    }

    /** @returns {ButtonBuilder} */
    getButton() {
        return new ButtonBuilder().setCustomId(this.customId).setStyle(this.style).setLabel(this.label);
    }

    /** @returns {ButtonAction} */
    register() {
        if (!this.core.buttonActions.includes(this)) {
            this.core.buttonActions.push(this);
        }
        return this;
    }

    /** @returns {ButtonAction} */
    unregister() {
        const index = this.core.buttonActions.indexOf(this);
        if (index !== -1) {
            this.core.buttonActions.splice(index, 1);
        }
        return this;
    }
}