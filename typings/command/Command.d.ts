export = Command;
declare class Command {
    /**
     * @param {object} data
     * @param {string} data.name
     * @param {string} [data.description="No description."]
     * @param {string[]} [data.args=[]] - for message command
     * @param {(ApplicationCommandOptionData & { autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void> })[]} [data.options=[]] - For slash command. You can use `autocompleter` recursively.
     * @param {string[]} [data.aliases=[]]
     * @param {("SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU")[]} [data.supports=["SLASH_COMMAND", "MESSAGE_COMMAND"]]
     * @param {(ic: InteractionCore, args: object, core: Core) => Promise<void>} data.run
     */
    constructor(data: {
        name: string;
        description?: string;
        args?: string[];
        options?: (ApplicationCommandOptionData & {
            autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void>;
        })[];
        aliases?: string[];
        supports?: ("SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU")[];
        run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
    });
    data: any;
    /** @type {string} */
    name: string;
    /** @type {string} */
    description: string;
    /** @type {string[]} */
    args: string[];
    /** @type {(ApplicationCommandOptionData & { autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void> })[]} */
    options: (ApplicationCommandOptionData & {
        autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void>;
    })[];
    /** @type {string[]} */
    aliases: string[];
    /** @type {("SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU")[]} */
    supports: ("SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU")[];
    /** @type {(ic: InteractionCore, args: object, core: Core) => Promise<void>} */
    run: (ic: InteractionCore, args: object, core: Core) => Promise<void>;
}
import { ApplicationCommandOptionData } from "discord.js";
import { AutocompleteInteraction } from "discord.js";
import InteractionCore = require("./InteractionCore");
import Core = require("../core/Core");
