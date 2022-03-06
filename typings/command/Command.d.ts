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
     * @param {(ic: InteractionCore, args: object, core: Core) => Promise<MessageOptions>} data.run
     * @param {(ic: InteractionCore, sent: Message, args: object, core: Core) => Promise<void> | null} data.runAfter
     */
    constructor(data: {
        name: string;
        description: string;
        args: string[] | null;
        options: ApplicationCommandOptionData[] | null;
        aliases: string[] | null;
        type: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
        run: (ic: InteractionCore, args: object, core: Core) => Promise<MessageOptions>;
        runAfter: (ic: InteractionCore, sent: Message, args: object, core: Core) => Promise<void> | null;
    });
    data: {
        name: string;
        description: string;
        args: string[] | null;
        options: ApplicationCommandOptionData[] | null;
        aliases: string[] | null;
        type: "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE";
        run: (ic: InteractionCore, args: object, core: Core) => Promise<MessageOptions>;
        runAfter: (ic: InteractionCore, sent: Message, args: object, core: Core) => Promise<void> | null;
    };
    name: string;
    description: string;
    args: string[];
    options: ApplicationCommandOptionData[];
    aliases: string[];
    type: "NONE" | "BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND";
    run: (ic: InteractionCore, args: object, core: Core) => Promise<MessageOptions>;
    runAfter: (ic: InteractionCore, sent: Message, args: object, core: Core) => Promise<void> | null;
}
import { ApplicationCommandOptionData } from "discord.js";
import InteractionCore = require("./InteractionCore");
import Core = require("../core/Core");
import { MessageOptions } from "discord.js";
import { Message } from "discord.js";
