export = CustomEmoji;
declare class CustomEmoji {
    /**
     * @param {Core | Client} client
     * @param {number} emojiId
     */
    constructor(client: Core | Client, emojiId: number);
    /** @readonly @type {Client} */
    readonly client: Client;
    /** @readonly @type {number} */
    readonly emojiId: number;
    /** @readonly @type {string} */
    readonly emoji: string;
    /** @readonly @type {boolean} */
    readonly fetched: boolean;
    /** @returns {string} */
    resolve(): string;
}
import { Client } from "discord.js";
import Core = require("../core/Core");
