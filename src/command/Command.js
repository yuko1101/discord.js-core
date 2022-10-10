"use strict";
const { Message, MessageCreateOptions, ApplicationCommandOptionData, AutocompleteInteraction } = require("discord.js");
const Core = require("../core/Core");
const { bindOptions } = require("../utils/utils");
const InteractionCore = require("./InteractionCore");

const defaultData = {
    name: "", //required
    description: "No description.",
    args: [],
    options: [],
    aliases: [],
    supports: ["SLASH_COMMAND", "MESSAGE_COMMAND"],
    run: async (ic, args, core) => { }, //required
}

module.exports = class Command {
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
    constructor(data) {
        this.data = bindOptions(defaultData, data);
        /** @type {string} */
        this.name = this.data.name;
        /** @type {string} */
        this.description = this.data.description;
        /** @type {string[]} */
        this.args = this.data.args;
        /** @type {(ApplicationCommandOptionData & { autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void> })[]} */
        this.options = this.data.options;
        /** @type {string[]} */
        this.aliases = this.data.aliases;
        /** @type {("SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU")[]} */
        this.supports = this.data.supports;
        /** @type {(ic: InteractionCore, args: object, core: Core) => Promise<void>} */
        this.run = this.data.run;
    }
}