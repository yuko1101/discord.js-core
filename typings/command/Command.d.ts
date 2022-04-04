export = Command;
declare class Command {
    /**
     * @param {object} data
     * @param {string} data.name
     * @param {string} data.description
     * @param {string[] | null} data.args - for message command
     * @param {ApplicationCommandOptionData[] | null} data.options - for slash command
     * @param {string[] | null} data.aliases
     * @param {"BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE"} data.type
     * @param {(ic: InteractionCore, args: object, core: Core) => Promise<void>} data.run
     */
    constructor(data: {
        name: string;
        description: string;
        args: string[] | null;
        options: ApplicationCommandOptionData[] | null;
        aliases: string[] | null;
        type: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
        run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
    });
    data: {
        name: string;
        description: string;
        args: string[] | null;
        options: ApplicationCommandOptionData[] | null;
        aliases: string[] | null;
        type: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
        run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
    };
    name: string;
    description: string;
    args: string[];
    options: ApplicationCommandOptionData[];
    aliases: string[];
    type: "NONE" | "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND";
    run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
}
import { ApplicationCommandOptionData } from "discord.js";
import InteractionCore = require("./InteractionCore");
import Core = require("../core/Core");
