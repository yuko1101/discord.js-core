"use strict";

const { Client } = require("discord.js");
const fs = require("fs");
const path = require("path");

const Command = require("../command/Command");
const commandManager = require("./commandManager");
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
     * @param {Client<boolean>} client 
     * @param {{ debug: boolean, token: string, prefix: string, guildId?: string }} options
     */
    constructor(client, options) {
        if (!options) throw new Error("Core options are required.");
        /** @readonly @type {Client<boolean>} */
        this.client = client;
        /** @readonly @type {{ debug: boolean, token: string, prefix: string, guildId?: string }} */
        this.options = bindOptions(defaultOptions, options);

        if (this.options.debug && !this.options.guildId) {
            throw Error("You should not use debug mode for global. Global application commands take too much time to apply their updates.")
        }

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

    /** @param {Command[]} commands */
    addCommands(...commands) {
        this.commands.push(...commands);
    }

    /** 
     * @param {string} dir
     * @param {boolean} recursive
     * @returns {Promise<Command[]>}
     */
    async addCommandsInDir(dir, recursive) {
        const cwd = process.argv[1].replace(/\\/g, "/").replace(/\/[^\/]+\.[^\/]+$/, "");
        const files = fs.readdirSync(`${cwd}/${dir}`);
        const commands = [];
        for (const file of files) {
            const loadedFile = fs.lstatSync(`${cwd}/${dir}/${file}`);
            if (loadedFile.isDirectory()) {
                if (!recursive) continue;
                this.addCommandsInDir(`${dir}/${file}`, true);
            } else {
                const command = (await import(`file:///${cwd}/${dir}/${file}`)).default;
                if (!(command instanceof Command)) {
                    if (this.options.debug) console.log(`Skipped importing ./${dir}/${file} because it is not a command file.`);
                    continue;
                }
                commands.push(command);
            }
        }
        this.addCommands(...commands);
        return commands;
    }

    /** @param {Command} command */
    removeCommand(command) {
        this.commands = this.commands.filter(c => c.name !== command.name);
    }

    async applyCommands() {
        await commandManager.applyCommands(this);
    }
}