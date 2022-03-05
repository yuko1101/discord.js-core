import { Client } from "discord.js";
import Core = require("./core/Core");


/** @type {Core} */
export const Core: typeof Core;
/** @type {Command} */
export const Command: any;
/** @type {Reaction} */
export const Reaction: any;
/** @type {ConfigFile} */
export const ConfigFile: any;
/** @type {Pages} */
export const Pages: any;
/** @type {CustomEmoji} */
export const CustomEmoji: any;

export interface CoreOptions {
    debug?: boolean;
    token: string;
    prefix?: string;
    guildId?: string;
}

export class Core {
    /**
     * @param {Client} client
     * @param {boolean} options.debugMode
     * @param {string} options.token
     * @param {string} options.prefix
     */
    constructor(client: Client, options: CoreOptions);
    readonly client: Client<boolean>;
    readonly options: CoreOptions;

    login: () => Promise<string>;
}


