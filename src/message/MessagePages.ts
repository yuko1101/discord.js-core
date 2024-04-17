import { Complement, PartialSome, bindOptions } from "config_file.js";
import { FlexibleMessageOptions, convertToMessageEditOptions, convertToMessageOptions } from "./MessageOptions"; import { Message, MessageCreateOptions, MessageEditOptions } from "discord.js";
import { SimpleBuilder } from "../utils/Builder";
import Core from "../core/Core";

export interface MessagePagesOptions {
    readonly timeout?: number;
    readonly pageCaching?: boolean;
    readonly core: Core
}

const defaultOptions = {
    timeout: 60000,
    pageCaching: false,
} as const satisfies PartialSome<MessagePagesOptions, "core">;

export default class MessagePages extends SimpleBuilder {
    readonly pages: (FlexibleMessageOptions<MessageCreateOptions> | Promise<FlexibleMessageOptions<MessageCreateOptions>> | (() => FlexibleMessageOptions<MessageCreateOptions>) | (() => Promise<FlexibleMessageOptions<MessageCreateOptions>>))[];
    readonly options: MessagePagesOptions;
    readonly pageCache: FlexibleMessageOptions<MessageCreateOptions>[] = [];

    sent = false;
    message: Message | null = null;
    currentPage = 0;

    constructor(pages: (FlexibleMessageOptions<MessageCreateOptions> | Promise<FlexibleMessageOptions<MessageCreateOptions>> | (() => FlexibleMessageOptions<MessageCreateOptions>) | (() => Promise<FlexibleMessageOptions<MessageCreateOptions>>))[], options: Complement<typeof defaultOptions, MessagePagesOptions>) {
        super();
        this.pages = pages;
        this.options = bindOptions(defaultOptions, options);
    }

    async getPage(index: number): Promise<FlexibleMessageOptions<MessageCreateOptions>> {
        if (this.options.pageCaching && this.pageCache[index]) {
            return this.pageCache[index];
        }
        const page = this.pages[index];
        if (typeof page === "function") {
            const p = await page();
            if (this.options.pageCaching) {
                this.pageCache[index] = p;
            }
            return p;
        }
        return await page;
    }

    async send(sendFn: (messageOptions: FlexibleMessageOptions<MessageCreateOptions>) => Promise<Message | null>) {
        if (this.message) throw new Error("Message already sent");
        const page = await this.getPage(this.currentPage);
        const message = await sendFn(page);
        this.message = message;
        this.sent = true;
    }

    async goto(index: number, editFn?: (messageOptions: MessageEditOptions) => Promise<void>) {
        if (index < 0 || index >= this.pages.length) {
            throw new Error("Index out of bounds");
        }
        this.currentPage = index;
        if (!this.sent) return;

        const edit = editFn ?? this.message ? (async (m: MessageEditOptions) => await this.message?.edit(m)) : null;
        if (!edit) throw new Error("No edit function provided");

        const page = await this.getPage(index);
        const editOptions = convertToMessageEditOptions(convertToMessageOptions(page));
        await edit(editOptions);
    }

    clone(): MessagePages {
        return new MessagePages(this.pages, this.options);
    }

}