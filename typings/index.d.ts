import { Client, CommandInteractionOption, Message, MessageOptions } from "discord.js";

/** @type {Core} */
export const Core: typeof Core;
/** @type {Command} */
export const Command: typeof Command;
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

export interface CommandData {
    name: string;
    description: string;
    args?: string[];
    options?: CommandInteractionOption[];
    aliases?: string[];
    run?: (msg: Message, args: object, core: Core) => MessageOptions | Promise<MessageOptions>;
    runAfter?: (msg: Message, sent: Message, args: object, core: Core) => void | Promise<void>;
}

export class Command {
    /**
     * @param {string} data.name
     * @param {string} data.description
     * @param {string[]} data.args - for message command
     * @param {CommandInteractionOption[]} data.options - for slash command
     * @param {string[]} data.aliases
     */
    constructor(data: CommandData);
    data: CommandData;
    name: string;
    description: string;
    args: string[];
    options: CommandInteractionOption[];
    aliases: string[];
    run: (msg: Message, args: object, core: Core) => MessageOptions | Promise<MessageOptions>;
    runAfter: (msg: Message, sent: Message, args: object, core: Core) => void | Promise<void>;
}
