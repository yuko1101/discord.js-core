import { actionsList } from "../message/MessagePages";
import ButtonAction, { ButtonActionOptions } from "./ButtonAction";
import EmojiAction, { EmojiActionOptions } from "./EmojiAction";

/** @extends {EmojiAction} */
export class PageEmojiAction extends EmojiAction {
    /**  */
    readonly pageActionType: typeof actionsList[number];

    /**
     * @param options
     */
    constructor(options: Omit<EmojiActionOptions, "run"> & { pageActionType: typeof actionsList[number] }) {
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        super({ ...options, run: async () => { } });

        this.pageActionType = options.pageActionType;
    }
}

/** @extends {ButtonAction} */
export class PageButtonAction extends ButtonAction {
    /**  */
    readonly pageActionType: typeof actionsList[number];

    /**
     * @param options
     */
    constructor(options: Omit<ButtonActionOptions, "run"> & { pageActionType: typeof actionsList[number] }) {
        // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
        super({ ...options, run: async () => { } });

        this.pageActionType = options.pageActionType;
    }
}