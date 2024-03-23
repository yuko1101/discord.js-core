import { Complement, PartialSome, bindOptions } from "config_file.js";
import { CoreMessageOptions } from "./MessageOptions";
import { MessageCreateOptions } from "discord.js";
import { SimpleBuilder } from "../utils/Builder";
import Core from "../core/Core";

export interface MessagePagesOptions {
    readonly timeout?: number;
    readonly cachedPages?: boolean;
    readonly core: Core
}

const defaultOptions = {
    timeout: 60000,
    cachedPages: false,
} as const satisfies PartialSome<MessagePagesOptions, "core">;

export default class MessagePages extends SimpleBuilder {
    readonly pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[];
    readonly options: MessagePagesOptions;
    readonly pageCache: CoreMessageOptions<MessageCreateOptions>[] = [];

    constructor(pages: (CoreMessageOptions<MessageCreateOptions> | Promise<CoreMessageOptions<MessageCreateOptions>> | (() => CoreMessageOptions<MessageCreateOptions>) | (() => Promise<CoreMessageOptions<MessageCreateOptions>>))[], options: Complement<typeof defaultOptions, MessagePagesOptions>) {
        super();
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