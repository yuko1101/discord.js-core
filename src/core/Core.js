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

    /** @param {Command} command */
    addCommand(command) {
        this.commands.push(command);
    }

    /** 
     * @param {string} dir
     * @param {boolean} recursive
     */
    addCommandsInDir(dir, recursive) {
        const files = fs.readdirSync(`./${dir}`);
        for (const file of files) {
            const loadedFile = fs.lstatSync(`./${dir}/${file}`);
            if (loadedFile.isDirectory()) {
                if (!recursive) continue;
                this.addCommandsInDir(`${dir}/${file}`);
            }
            else {
                const command = require(path.resolve(require.main.path, dir, file));
                this.addCommand(command);
            }
        }
    }

    /** @param {Command} command */
    removeCommand(command) {
        this.commands = this.commands.filter(c => c.name !== command.name);
    }

    async applyCommands() {
        await commandManager.applyCommands(this);
    }
}