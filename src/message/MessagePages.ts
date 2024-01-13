import { bindOptions } from "config_file.js";
import { CoreMessageCreateOptions } from "./MessageOptions";

export interface MessagePagesOptions {
    readonly timeout?: number;
    readonly cachedPages?: boolean;
}

const defaultOptions = {
    timeout: 60000,
    cachedPages: false,
} satisfies MessagePagesOptions;

export default class MessagePages {
    readonly pages: (CoreMessageCreateOptions | Promise<CoreMessageCreateOptions> | (() => CoreMessageCreateOptions) | (() => Promise<CoreMessageCreateOptions>))[];
    readonly options: MessagePagesOptions;
    readonly pageCache: CoreMessageCreateOptions[] = [];

    constructor(pages: (CoreMessageCreateOptions | Promise<CoreMessageCreateOptions> | (() => CoreMessageCreateOptions) | (() => Promise<CoreMessageCreateOptions>))[], options: Partial<MessagePagesOptions>) {
        this.pages = pages;
        this.options = bindOptions(defaultOptions, options);
    }

    async getPage(index: number): Promise<CoreMessageCreateOptions> {
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
}