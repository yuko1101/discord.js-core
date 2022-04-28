"use strict";

const { Client } = require("discord.js");
const Command = require("../command/Command");
const commandManager = require("./slashCommandManager");
const handler = require("./handler");
const EmojiAction = require("../action/EmojiAction");
const ButtonAction = require("../action/ButtonAction");
const { bindOptions } = require("../utils/utils");
const SelectMenuAction = require("../action/SelectMenuAction");

const defaultOptions = {
    debug: false,
    token: null,
    prefix: "!",
    guildId: null, // nullable
}

module.exports = class Core {
    /**
     * @param {Client} client 
     * @param {{ debug: boolean, token: string, prefix: string, guildId?: string }} options
     */
    constructor(client, options) {
        if (!options) throw new Error("Core options are required.");
        /** @readonly */
        this.client = client;
        /** @readonly @type {{ debug: boolean, token: string, prefix: string, guildId?: string }} */
        this.options = bindOptions(defaultOptions, options);


        /** @readonly @type {Command[]} */
        this.commands = [];
        /** @readonly @type {EmojiAction[]} */
        this.emojiActions = [];
        /** @readonly @type {ButtonAction[]} */
        this.buttonActions = [];
        /** @readonly @type {SelectMenuAction[]} */
        this.selectMenuActions = [];

        handler.init(this);

    }

    /** @param {() => *} [callback] */
    async login(callback) {
        this.client.once("ready", () => { console.log(`Logged in as ${this.client.user.tag}!`); });
        await this.client.login(this.options.token);
        if (callback) callback();
    }

    /** @param {Command} command */
    addCommand(command) {
        this.commands.push(command);
    }
    /** @param {Command} command */
    removeCommand(command) {
        this.commands = this.commands.filter(c => c.name !== command.name);
    }

    async applySlashCommands() {
        await commandManager.applySlashCommands(this);
    }
}