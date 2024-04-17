import { Complement, PartialSome, bindOptions } from "config_file.js";
import { CoreMessageOptions, convertToMessageEditOptions, convertToMessageOptions } from "./MessageOptions";import { Message, MessageCreateOptions } from "discord.js";
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
    readonly pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[];
    readonly options: MessagePagesOptions;
    readonly pageCache: CoreMessageOptions<MessageCreateOptions>[] = [];

    message: Message | null = null;
    currentPage = 0;

    constructor(pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[], options: Complement<typeof defaultOptions, MessagePagesOptions>) {
        super();
        this.pages = pages;
        this.options = bindOptions(defaultOptions, options);
    }

    async getPage(index: number): Promise<CoreMessageOptions<MessageCreateOptions>> {
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

    async send(sendFn: (messageOptions: CoreMessageOptions<MessageCreateOptions>) => Promise<Message>): Promise<Message> {
        if (this.message) throw new Error("Message already sent");
        const page = await this.getPage(this.currentPage);
        const message = await sendFn(page);
        this.message = message;

        return message;
    }

    async goto(index: number) {
        if (index < 0 || index >= this.pages.length) {
            throw new Error("Index out of bounds");
        }
        this.currentPage = index;
        if (this.message) {
            const page = await this.getPage(index);
            const editOptions = convertToMessageEditOptions(convertToMessageOptions(page));
            await this.message.edit(editOptions);
        }
    }

    clone(): MessagePages {
        return new MessagePages(this.pages, this.options);
    }

}