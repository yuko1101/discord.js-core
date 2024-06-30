import { ButtonInteraction, ButtonStyle, ButtonBuilder } from "discord.js";
import { InteractiveAction, InteractiveActionOptions } from "./Action";
import { JsonElement } from "config_file.js";

export interface ButtonActionOptions extends InteractiveActionOptions {
    readonly label: string;
    readonly run: (interaction: ButtonInteraction, data: JsonElement | undefined) => Promise<void>;
    readonly style?: ButtonStyle;
}

export default class ButtonAction extends InteractiveAction {
    readonly options: ButtonActionOptions;
    readonly label: string;
    readonly style: ButtonStyle;
    run: (interaction: ButtonInteraction, data: JsonElement | undefined) => Promise<void>;

    constructor(options: ButtonActionOptions) {
        super(options);

        this.options = options;
        this.label = this.options.label;
        this.style = this.options.style ?? ButtonStyle.Primary;

        this.run = this.options.run;
    }

    getComponent(data: JsonElement | undefined = undefined): ButtonBuilder {
        const customId = this.getCustomIdWithData(data);
        return new ButtonBuilder().setCustomId(customId).setStyle(this.style).setLabel(this.label);
    }

    register(): this {
        if (!this.core.buttonActions.includes(this)) {
            this.core.buttonActions.push(this);
        }
        return this;
    }

    unregister(): this {
        const index = this.core.buttonActions.indexOf(this);
        if (index !== -1) {
            this.core.buttonActions.splice(index, 1);
        }
        return this;
    }
}