import { MessageComponentBuilder } from "discord.js";
import Core from "../core/Core";
import { devModeCommandPrefix } from "../core/commandManager";
import { JsonElement } from "config_file.js";

export const actionDataSeparator = "#";

/** @typedef */
export interface ActionOptions {
    readonly core: Core;
}

/** Action is a message action which is a reaction or a button. */
export default class Action {
    /**  */
    readonly core: Core;

    /**
     * @param options
     */
    constructor(options: { core: Core }) {
        this.core = options.core;
    }
}

export interface InteractionActionOptions extends ActionOptions {
    readonly customId: string;
}

/** @extends {Action} */
export abstract class InteractionAction extends Action {
    /**  */
    readonly customId: string;

    constructor(options: InteractionActionOptions) {
        super(options);

        if (options.customId.includes(actionDataSeparator)) throw new Error(`The customId of an interaction action cannot contain the character "${actionDataSeparator}".`);

        this.customId = `${this.core.options.devMode ? devModeCommandPrefix : ""}${options.customId}`;
    }

    getCustomIdWithData(data: JsonElement | undefined): string {
        return data !== undefined ? `${this.customId}${actionDataSeparator}${Buffer.from(JSON.stringify(data)).toString("base64")}` : this.customId;
    }

    abstract getComponent(data: JsonElement | undefined): MessageComponentBuilder;
}