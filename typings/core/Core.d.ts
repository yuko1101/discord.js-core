export = Core;
declare class Core {
    /**
     * @param {Client} client
     * @param {{ debug: boolean, token: string, prefix: string, guildId?: string }} options
     */
    constructor(client: Client, options: {
        debug: boolean;
        token: string;
        prefix: string;
        guildId?: string;
    });
    /** @readonly */
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
    /** @param {() => *} [callback] */
    login(callback?: () => any): Promise<void>;
    /** @param {Command} command */
    addCommand(command: Command): void;
    /** @param {Command} command */
    removeCommand(command: Command): void;
    applySlashCommands(): Promise<void>;
}
import { Client } from "discord.js";
import Command = require("../command/Command");
import EmojiAction = require("../action/EmojiAction");
import ButtonAction = require("../action/ButtonAction");
