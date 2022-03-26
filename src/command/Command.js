"use strict";
const { Message, MessageOptions, ApplicationCommandOptionData } = require("discord.js");
const Core = require("../core/Core");
const InteractionCore = require("./InteractionCore");

const defaultData = {
    name: "", //required
    description: "", //required
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
     * @param {string} data.description
     * @param {string[] | null} data.args - for message command
     * @param {ApplicationCommandOptionData[] | null} data.options - for slash command
     * @param {string[] | null} data.aliases
     * @param {"BOTH" | "MESSAGE_COMMAND" | "SLASH_COMMAND" | "NONE"} data.type
     * @param {(ic: InteractionCore, args: object, core: Core) => Promise<void>} data.run
     */
    constructor(data) {
        this.data = { ...defaultData, ...data };
        this.name = this.data.name;
        this.description = this.data.description;
        this.args = this.data.args;
        this.options = this.data.options;
        this.aliases = this.data.aliases;
        this.type = this.data.type;
        this.run = this.data.run;
    }
}