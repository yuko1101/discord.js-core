export = Core;
declare class Core {
    /**
     * @param {Client<boolean>} client
     * @param {{ debug: boolean, token: string, prefix: string, guildId?: string }} options
     */
    constructor(client: Client<boolean>, options: {
        debug: boolean;
        token: string;
        prefix: string;
        guildId?: string;
    });
    /** @readonly @type {Client<boolean>} */
    readonly client: Client<boolean>;
    /** @readonly @type {{ debug: boolean, token: string, prefix: string, guildId?: string }} */
    readonly options: {
        debug: boolean;
        token: string;
        prefix: string;
        guildId?: string;
    };
    /** @readonly @type {Command[]} */
    readonly commands: Command[];
    /** @readonly @type {EmojiAction[]} */
    readonly emojiActions: EmojiAction[];
    /** @readonly @type {ButtonAction[]} */
    readonly buttonActions: ButtonAction[];
    /** @readonly @type {SelectMenuAction[]} */
    readonly selectMenuActions: SelectMenuAction[];
    /** @param {() => *} [callback] */
    login(callback?: () => any): Promise<void>;
    /** @param {Command[]} commands */
    addCommands(...commands: Command[]): void;
    /**
     * @param {string} dir
     * @param {boolean} recursive
     * @returns {Promise<Command[]>}
     */
    addCommandsInDir(dir: string, recursive: boolean): Promise<Command[]>;
    /** @param {Command} command */
    removeCommand(command: Command): void;
    applyCommands(): Promise<void>;
}
import { Client } from "discord.js";
import Command = require("../command/Command");
import EmojiAction = require("../action/EmojiAction");
import ButtonAction = require("../action/ButtonAction");
import SelectMenuAction = require("../action/SelectMenuAction");
