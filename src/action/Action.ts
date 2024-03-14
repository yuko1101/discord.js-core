import { MessageComponentBuilder } from "discord.js";
import Core from "../core/Core";
import { devModeCommandPrefix } from "../core/commandManager";
import { JsonElement } from "config_file.js";
import zlib from "zlib";
import { SimpleBuilder } from "../utils/Builder";

export const actionDataSeparator = "#";

/** @typedef */
export interface ActionOptions {
    readonly core: Core;
}

/** Action is a message action which is a reaction or a button. */
export default class Action extends SimpleBuilder {
    /**  */
    readonly core: Core;

    /**
     * @param options
     */
    constructor(options: ActionOptions) {
        super();
        this.core = options.core;
    }
}

export interface InteractiveActionOptions extends ActionOptions {
    readonly customId: string;
}

/** @extends {Action} */
export abstract class InteractiveAction extends Action {
    /**  */
    readonly customId: string;

    constructor(options: InteractiveActionOptions) {
        super(options);

        if (options.customId.includes(actionDataSeparator)) throw new Error(`The customId of an interaction action cannot contain the character "${actionDataSeparator}".`);

        this.customId = `${this.core.options.devMode ? devModeCommandPrefix : ""}${options.customId}`;
    }

    getCustomIdWithData(data: JsonElement | undefined): string {
        const customId = (() => {
            if (!data) return this.customId;
            const remainingLength = 100 - this.customId.length - actionDataSeparator.length;
            const jsonStr = JSON.stringify(data);
            let dataStr = "r" + jsonStr;
            if (dataStr.length > remainingLength) dataStr = "c" + compressString(jsonStr);
            if (dataStr.length > remainingLength) dataStr = "g" + compressStringWithGzip(jsonStr);
            return `${this.customId}${actionDataSeparator}${dataStr}`;
        })();
        if (customId.length > 100) throw new Error("The customId of an interaction action cannot be longer than 100 characters. Please shorten the customId or use a shorter data.");
        return customId;
    }

    abstract getComponent(data: JsonElement | undefined): MessageComponentBuilder;
}

function compressBase64(base64: string): string {
    const compressed = base64.replace(/=+$/, "").replace(/.{2}/g, (match) => {
        const code = match.charCodeAt(0) * 256 + match.charCodeAt(1);
        return String.fromCharCode(code);
    });

    return compressed;
}

function compressString(str: string): string {
    const base64 = Buffer.from(str).toString("base64");
    return compressBase64(base64);
}

function compressStringWithGzip(str: string): string {
    const base64 = zlib.gzipSync(encodeURIComponent(str)).toString("base64");
    return compressBase64(base64);
}

/**
 * @param compressed
 * @returns base64
 */
function decompressBase64(compressed: string): string {
    const halfWidth = compressed.split("").map(char => {
        const code = char.charCodeAt(0);
        const first = Math.floor(code / 256);
        const second = code % 256;
        if (first === 0) return String.fromCharCode(second);
        return String.fromCharCode(first) + String.fromCharCode(second);
    }).join("");

    const base64 = halfWidth + "===".slice((4 - halfWidth.length) % 4);
    return base64;
}

export function decompressString(compressed: string): string {
    const base64 = decompressBase64(compressed);
    return Buffer.from(base64, "base64").toString("utf8");
}

export function decompressStringWithGzip(compressed: string): string {
    const base64 = decompressBase64(compressed);
    return decodeURIComponent(zlib.unzipSync(Buffer.from(base64, "base64")).toString("utf8"));
}