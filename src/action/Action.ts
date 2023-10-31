import { MessageActionRowComponentData, MessageComponentBuilder } from "discord.js";
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
        const customId = data !== undefined ? `${this.customId}${actionDataSeparator}${compressJson(data)}` : this.customId;
        if (customId.length > 100) throw new Error("The customId of an interaction action cannot be longer than 100 characters. Please shorten the customId or use a shorter data.");
        return customId;
    }

    abstract getComponent(data: JsonElement | undefined): MessageComponentBuilder | MessageActionRowComponentData;
}


function compressJson(json: JsonElement): string {
    const base64 = Buffer.from(JSON.stringify(json)).toString("base64");

    return base64.replace(/=+$/, "").replace(/.{2}/g, (match) => {
        const code = match.charCodeAt(0) * 256 + match.charCodeAt(1);
        return String.fromCharCode(code);
    });
}

export function decompressJson(str: string): JsonElement {
    const halfWidth = str.split("").map(char => {
        const code = char.charCodeAt(0);
        const first = Math.floor(code / 256);
        const second = code % 256;
        if (first === 0) return String.fromCharCode(second);
        return String.fromCharCode(first) + String.fromCharCode(second);
    }).join("");

    const base64 = halfWidth + "===".slice((halfWidth.length + 3) % 4);

    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
}