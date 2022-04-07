export = Command;
declare class Command {
    /**
     * @param {object} data
     * @param {string} data.name
     * @param {string} [data.description="No description."]
     * @param {string[]} [data.args=[]] - for message command
     * @param {ApplicationCommandOptionData[]} [data.options=[]] - for slash command
     * @param {string[]} [data.aliases=[]]
     * @param {"BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE"} [data.type="BOTH"]
     * @param {(ic: InteractionCore, args: object, core: Core) => Promise<void>} data.run
     */
    constructor(data: {
        name: string;
        description?: string;
        args?: string[];
        options?: ApplicationCommandOptionData[];
        aliases?: string[];
        type?: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
        run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
    });
    data: any;
    /** @type {string} */
    name: string;
    /** @type {string} */
    description: string;
    /** @type {string[]} */
    args: string[];
    /** @type {ApplicationCommandOptionData[]} */
    options: ApplicationCommandOptionData[];
    /** @type {string[]} */
    aliases: string[];
    /** @type {"BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE"} */
    type: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
    /** @type {(ic: InteractionCore, args: object, core: Core) => Promise<void>} */
    run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
}
import { ApplicationCommandOptionData } from "discord.js";
import InteractionCore = require("./InteractionCore");
import Core = require("../core/Core");
