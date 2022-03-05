"use strict";

const { Client } = require("discord.js");

const defaultOptions = {
    debug: false,
    token: null,
    prefix: "!",
    guildId: null,
}

module.exports = class Core {
    /**
     * @param {Client} client 
     * @param {boolean} options.debug
     * @param {string} options.token
     * @param {string} options.prefix
     * @param {string} options.guildId
     */
    constructor(client, options) {
        this.client = client;
        this.options = { ...defaultOptions, ...options };
        /** @type {...Command} */
        this.commands = [];
    }

    async login() {
        this.client.once("ready", () => { console.log(`Logged in as ${this.client.user.tag}!`); });
        await this.client.login(this.options.token);
    }
}