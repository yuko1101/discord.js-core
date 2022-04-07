"use strict";
const { Message, MessageOptions, ApplicationCommandOptionData } = require("discord.js");
const Core = require("../core/Core");
const { bindOptions } = require("../utils/utils");
const InteractionCore = require("./InteractionCore");

const defaultData = {
    name: "", //required
    description: "No description.",
    args: [],
    options: [],
    aliases: [],
    type: "BOTH",
    run: async (ic, args, core) => { }, //required
}

module.exports = class Command {
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
    constructor(data) {
        this.data = bindOptions(defaultData, data);
        /** @type {string} */
        this.name = this.data.name;
        /** @type {string} */
        this.description = this.data.description;
        /** @type {string[]} */
        this.args = this.data.args;
        /** @type {ApplicationCommandOptionData[]} */
        this.options = this.data.options;
        /** @type {string[]} */
        this.aliases = this.data.aliases;
        /** @type {"BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE"} */
        this.type = this.data.type;
        /** @type {(ic: InteractionCore, args: object, core: Core) => Promise<void>} */
        this.run = this.data.run;
    }
}