import { Client, GuildEmoji, Snowflake } from "discord.js";
import Core from "../core/Core";

export default class CustomEmoji {
    /**  */
    readonly client: Client<true>;
    /**  */
    readonly emojiId: Snowflake;

    /**  */
    emoji: GuildEmoji | null;
    /**  */
    fetched: boolean;

    /**
     * @param client
     * @param emojiId
     */
    constructor(client: Core<true> | Client, emojiId: Snowflake) {
        this.client = client instanceof Core ? client.client : client;
        this.emojiId = emojiId;

        this.emoji = this.client.emojis.resolve(this.emojiId) ?? null;

        /** @readonly @type {boolean} */
        this.fetched = this.emoji !== null;
    }

    /**  */
    resolve() {
        if (this.fetched) return this.emoji;

        const emoji = this.client.emojis.resolve(this.emojiId);

        if (!emoji) throw new Error("Emoji not found");

        this.emoji = emoji;
        this.fetched = true;

        return this.emoji;
    }
}