export = Core;
declare class Core {
    /**
     * @param {Client} client
     * @param {object} options
     * @param {boolean} options.debug
     * @param {string} options.token
     * @param {string} options.prefix
     * @param {string | null} options.guildId
     */
    constructor(client: Client, options: {
        debug: boolean;
        token: string;
        prefix: string;
        guildId: string | null;
    });
    /** @readonly */
    readonly client: Client<boolean>;
    /** @type {{ debug: boolean, token: string, prefix: string, guildId?: string  }} @readonly */
    readonly options: {
        debug: boolean;
        token: string;
        prefix: string;
        guildId?: string;
    };
    /** @type {Command[]} @readonly */
    readonly commands: Command[];
    login(): Promise<void>;
    /** @param {Command} command */
    addCommand(command: Command): void;
    /** @param {Command} command */
    removeCommand(command: Command): void;
    applySlashCommands(): Promise<void>;
}
import { Client } from "discord.js";
import Command = require("../command/Command");
