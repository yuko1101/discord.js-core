import { bindOptions } from "config_file.js";
import { CoreMessageOptions } from "./MessageOptions";
import { MessageCreateOptions } from "discord.js";

export interface MessagePagesOptions {
    readonly timeout?: number;
    readonly cachedPages?: boolean;
}

const defaultOptions = {
    timeout: 60000,
    cachedPages: false,
} satisfies MessagePagesOptions;

export default class MessagePages {
    readonly pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[];
    readonly options: MessagePagesOptions;
    readonly pageCache: CoreMessageOptions<MessageCreateOptions>[] = [];

    constructor(pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[], options: Partial<MessagePagesOptions>) {
        this.pages = pages;
        this.options = bindOptions(defaultOptions, options);
    }

    async getPage(index: number): Promise<CoreMessageOptions<MessageCreateOptions>> {
        if (this.options.cachedPages && this.pageCache[index]) {
            return this.pageCache[index];
        }
        const page = this.pages[index];
        if (typeof page === "function") {
            const p = await page();
            if (this.options.cachedPages) {
                this.pageCache[index] = p;
            }
            return p;
        }
        return await page;
    }

    // TODO: implement send method and other methods
}