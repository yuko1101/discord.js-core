const { Message, MessageOptions, CommandInteractionOption } = require("discord.js");
const Core = require("../core/Core");

const defaultData = {
    name: "",
    description: "",
    args: [],
    options: [],
    aliases: [],
    run: (msg, args, core) => { return {} },
    runAfter: (msg, sent, args, core) => { },
}

module.exports = class Command {
    /**
     * @param {string} data.name
     * @param {string} data.description
     * @param {string[]} data.args - for message command
     * @param {CommandInteractionOption[]} data.options - for slash command
     * @param {string[]} data.aliases
     * @param {(msg: Message, args: object, core: Core) => MessageOptions | Promise<MessageOptions>} data.run
     * @param {(msg: Message, sent: Message, args: object, core: Core) => void | Promise<void>} data.runAfter
     */
    constructor(data) {
        this.data = { ...defaultData, ...data };
        this.name = this.data.name;
        this.description = this.data.description;
        this.args = this.data.args;
        this.options = this.data.options;
        this.aliases = this.data.aliases;
        this.run = this.data.run;
        this.runAfter = this.data.runAfter;
    }
}