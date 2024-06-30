import { Complement, PartialSome, bindOptions } from "config_file.js";
import { FlexibleMessageOptions, convertToInteractionReplyOptions, convertToMessageEditOptions, convertToMessageOptions } from "./MessageOptions"; import { InteractionResponse, Message, MessageCreateOptions, MessageEditOptions, RepliableInteraction, TextBasedChannel, User } from "discord.js";
import { SimpleBuilder } from "../utils/Builder";
import Core from "../core/Core";

export interface MessagePagesOptions {
    readonly timeout?: number;
    readonly pages: Page[];
    readonly core: Core
}

const defaultOptions = {
    timeout: 60000,
} as const satisfies PartialSome<MessagePagesOptions, "pages" | "core">;

export type MessageOptionsResolvable = FlexibleMessageOptions<MessageCreateOptions> | Promise<FlexibleMessageOptions<MessageCreateOptions>> | (() => FlexibleMessageOptions<MessageCreateOptions>) | (() => Promise<FlexibleMessageOptions<MessageCreateOptions>>);

export default class MessagePages extends SimpleBuilder {
    readonly options: MessagePagesOptions;
    readonly pageCache: FlexibleMessageOptions<MessageCreateOptions>[] = [];

    sent = false;
    message: Message | InteractionResponse | null = null;
    interaction: RepliableInteraction | null = null;
    currentPage = 0;

    constructor(options: Complement<typeof defaultOptions, MessagePagesOptions>) {
        super();
        this.options = bindOptions(defaultOptions, options);
    }

    getPage(index: number): Promise<FlexibleMessageOptions<MessageCreateOptions>> {
        return this.options.pages[index].resolve();
    }

    async _send(sendFn: (messageOptions: FlexibleMessageOptions<MessageCreateOptions>) => Promise<Message | InteractionResponse>): Promise<Message | InteractionResponse> {
        if (this.message) throw new Error("Message already sent");
        const page = await this.getPage(this.currentPage);
        const message = await sendFn(page);
        this.message = message;
        this.sent = true;
        return message;
    }

    send(context: TextBasedChannel | RepliableInteraction | Message | User, followUp = false): Promise<Message | InteractionResponse> {
        // TODO: revert to false if send fails
        this.sent = true;
        function sendFn(messageOptions: FlexibleMessageOptions<MessageCreateOptions>): Promise<Message | InteractionResponse> {
            const converted = convertToMessageOptions(messageOptions);
            if ("reply" in context) {
                if ("isRepliable" in context) {
                    // interaction
                    if (followUp) return context.followUp(convertToInteractionReplyOptions(converted));
                    return context.reply(convertToInteractionReplyOptions(converted));
                }
                // message
                return context.reply(converted);
            }

            // channel, user
            return context.send(converted);
        }
        return this._send(sendFn);
    }

    async _goto(index: number, editFn: (messageOptions: MessageEditOptions) => Promise<Message | null>): Promise<Message | null> {
        if (index < 0 || index >= this.options.pages.length) {
            throw new Error("Index out of bounds");
        }
        this.currentPage = index;
        const message = this.message;
        if (!message) throw new Error("Message not sent");

        const page = await this.getPage(index);
        const editOptions = convertToMessageEditOptions(convertToMessageOptions(page));
        // TODO: wonder if the InteractionResponse#edit does return a non-null Message even if ephemeral
        return editFn(editOptions);
    }

    goto(index: number): Promise<Message | null> {
        const message = this.message;
        if (!message) throw new Error("Message not sent");

        return this._goto(index, m => message.edit(m));
    }

    clone(): MessagePages {
        return new MessagePages(this.options);
    }
}

export interface PageOptions {
    readonly caching?: boolean;
    readonly messageOptions: MessageOptionsResolvable;
}

const defaultPageOptions = {
    caching: true,
} as const satisfies PartialSome<PageOptions, "messageOptions">;

export class Page {
    readonly options: PageOptions;

    isResolved: boolean;
    messageOptionsCache: FlexibleMessageOptions<MessageCreateOptions> | null = null;

    constructor(options: Complement<typeof defaultPageOptions, PageOptions>) {
        this.options = bindOptions(defaultPageOptions, options);
        this.isResolved = typeof this.options.messageOptions !== "function" && !(this.options.messageOptions instanceof Promise);
    }

    async resolve(): Promise<FlexibleMessageOptions<MessageCreateOptions>> {
        if (this.options.caching && this.messageOptionsCache) {
            return this.messageOptionsCache;
        }
        const msgOptResolvable = this.options.messageOptions;
        if (typeof msgOptResolvable === "function") {
            const msgOptions = await msgOptResolvable();
            if (this.options.caching) {
                this.messageOptionsCache = msgOptions;
            }
            return msgOptions;
        }
        return await msgOptResolvable;
    }
}