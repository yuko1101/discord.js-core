"use strict";

const { Client } = require("discord.js");
const Command = require("../command/Command");
const commandManager = require("./slashCommandManager");
const handler = require("./handler");

const defaultOptions = {
    debug: false,
    token: null,
    prefix: "!",
    guildId: null, // nullable
}

module.exports = class Core {
    /**
     * @param {Client} client 
     * @param {object} options
     * @param {boolean} options.debug
     * @param {string} options.token
     * @param {string} options.prefix
     * @param {string | null} options.guildId
     */
    constructor(client, options) {
        /** @readonly */
        this.client = client;
        /** @type {{ debug: boolean, token: string, prefix: string, guildId?: string  }} @readonly */
        this.options = { ...defaultOptions, ...options };
        /** @type {Command[]} @readonly */
        this.commands = [];

        handler.init(this);
    }

    async login() {
        this.client.once("ready", () => { console.log(`Logged in as ${this.client.user.tag}!`); });
        await this.client.login(this.options.token);
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