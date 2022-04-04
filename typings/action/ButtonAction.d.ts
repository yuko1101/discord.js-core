export = ButtonAction;
declare class ButtonAction extends Action {
    /** @readonly @type {{label: string, core: Core, style: MessageButtonStyleResolvable, run: (interaction: ButtonInteraction) => Promise<void> }} */
    readonly options: {
        label: string;
        core: Core;
        style: MessageButtonStyleResolvable;
        run: (interaction: ButtonInteraction) => Promise<void>;
    };
    /** @type {MessageButtonStyleResolvable} */
    style: MessageButtonStyleResolvable;
    /** @type {(interaction: ButtonInteraction) => Promise<void>} */
    run: (interaction: ButtonInteraction) => Promise<void>;
    /** @readonly @type {string} */
    readonly customId: string;
    /** @readonly @type {boolean} */
    readonly isButtonAction: boolean;
    /** @returns {MessageButton} */
    getButton(): MessageButton;
    /** @returns {ButtonAction} */
    register(): ButtonAction;
    /** @returns {ButtonAction} */
    unregister(): ButtonAction;
}
import Action = require("./Action");
import Core = require("../core/Core");
import { MessageButtonStyleResolvable } from "discord.js";
import { ButtonInteraction } from "discord.js";
import { MessageButton } from "discord.js";
