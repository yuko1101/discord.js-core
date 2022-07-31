const { Client } = require("discord.js");
const Core = require("../core/Core");

module.exports = class CustomEmoji {
    /**
     * @param {Core | Client} client 
     * @param {number} emojiId 
     */
    constructor(client, emojiId) {
        /** @readonly @type {Client} */
        this.client = client.client || client;
        /** @readonly @type {number} */
        this.emojiId = emojiId;

        /** @readonly @type {string} */
        this.emoji = this.client.emojis.resolve(this.emojiId) || "";

        /** @readonly @type {boolean} */
        this.fetched = this.emoji !== "";
    }

    /** @returns {string} */
    resolve() {
        if (this.fetched) return this.emoji;

        const emoji = this.client.emojis.resolve(this.emojiId)

        if (!emoji) throw new Error("Emoji not found");

        this.emoji = emoji.name;
        this.fetched = true;

        return this.emoji;
    }
}