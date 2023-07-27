import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, MessageComponentInteraction, MessageReaction, PartialMessageReaction, PartialUser, RepliableInteraction, TextBasedChannel, User } from "discord.js";
import MessageCore from "./MessageCore";
import EmojiAction from "../action/EmojiAction";
import ButtonAction from "../action/ButtonAction";
import SelectMenuAction, { AnySelectMenuAction } from "../action/SelectMenuAction";
import { bindOptions } from "config_file.js";
import { PageButtonAction, PageEmojiAction } from "../action/PageActions";

export const actionsList = ["FIRST", "BACK", "NEXT", "LAST"] as const;

/** @typedef */
export interface MessagePagesOptions {
    readonly messageCores: (MessageCore | (() => Promise<MessageCore>))[];
    readonly startPageIndex?: number;
    readonly pageActions?: (EmojiAction | ButtonAction | AnySelectMenuAction)[][];
    readonly timeout?: number;
    readonly resetTimeoutTimerOnAction?: boolean;
    readonly userFilter?: (user: User | PartialUser) => Promise<boolean>;
}

/** @typedef */
export interface PageAction {
    readonly label: string;
    /** For button actions */
    readonly buttonStyle?: ButtonStyle;
}

export default class MessagePages {
    /**  */
    readonly options: MessagePagesOptions;
    /**  */
    readonly messageCores: (MessageCore | (() => Promise<MessageCore>))[];
    /**  */
    readonly startPageIndex: number;
    /**  */
    readonly pageActions: (EmojiAction | ButtonAction | AnySelectMenuAction)[][];
    /**  */
    readonly timeout: number | null;
    /**  */
    readonly resetTimeoutTimerOnAction: boolean;
    /**  */
    readonly userFilter: (user: User | PartialUser) => Promise<boolean>;

    /**  */
    sentMessage: Message | null;
    /**  */
    usedInteraction: RepliableInteraction | null;
    /**  */
    currentPageIndex: number;
    /**  */
    isDestroyed: boolean;

    /**
     * @param options
     */
    constructor(options: MessagePagesOptions) {
        this.options = options;
        this.messageCores = this.options.messageCores;
        if (this.messageCores.length === 0) {
            throw new Error("MessageCores cannot be empty");
        }
        this.startPageIndex = this.options.startPageIndex ?? 0;

        this.pageActions = this.options.pageActions ?? [];
        const actions = this.pageActions.flat();
        for (const action of actions) {
            if (action instanceof PageEmojiAction) {
                const actionType = action.pageActionType;
                action.run = async (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, isReactionAdded: boolean) => {
                    if (!isReactionAdded || !(await this.userFilter(user))) return;
                    messageReaction.users.remove(user.id);
                    await this.takeAction(null, actionType);
                };
            } else if (action instanceof PageButtonAction) {
                const actionType = action.pageActionType;
                action.run = async (interaction: ButtonInteraction) => {
                    if (!(await this.userFilter(interaction.user))) return;
                    await this.takeAction(interaction, actionType);
                };
            }
        }

        // TODO: timeout things
        this.timeout = this.options.timeout ?? null;
        this.resetTimeoutTimerOnAction = this.options.resetTimeoutTimerOnAction ?? true;
        this.userFilter = this.options.userFilter ?? (async () => true);

        this.sentMessage = null;
        this.usedInteraction = null;
        this.currentPageIndex = this.startPageIndex;

        this.isDestroyed = false;
    }

    get isSent(): boolean {
        return this.sentMessage != null;
    }


    /**
     * @param sendTo
     * @param options
     */
    async sendTo(sendTo: TextBasedChannel | Message, options: { edit?: boolean } = {}): Promise<Message> {
        if (this.isDestroyed) throw new Error("This MessagePages has been destroyed");
        if (this.isSent) throw new Error("This MessagePages has already been sent.");

        options = bindOptions({ edit: false }, options);

        if (options.edit && !(sendTo instanceof Message)) throw new Error("`whereToSend` must be a Message when editing.");

        const sendFunction = async (messageOptions: BaseMessageOptions) => {
            if (options.edit && sendTo instanceof Message) return await sendTo.edit(messageOptions);
            return await (sendTo instanceof Message ? sendTo.reply(messageOptions) : sendTo.send(messageOptions));
        };

        // send message
        this.sentMessage = await sendFunction(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));

        // apply reactions
        this._manageActions({ newIndex: this.currentPageIndex, registerPageActions: true });
        this._updateReactions();

        return this.sentMessage;
    }

    /**
     * Sends this MessagePages message as a reply of the interaction
     */
    async interactionReply(interaction: RepliableInteraction, options: { followUp?: boolean, ephemeral?: boolean, edit?: boolean } = {}): Promise<Message> {
        if (this.isDestroyed) throw new Error("This MessagePages has been destroyed");
        if (!interaction) throw new Error("Interaction cannot be null or undefined");
        options = bindOptions({
            followUp: false,
            ephemeral: false,
            edit: false,
        }, options);

        if (this.isSent) throw new Error("This MessagePages has already been sent.");

        if ((interaction.ephemeral || options.ephemeral)) {
            throw new Error("Ephemeral messages cannot have reactions.");
        }

        if (!options.followUp && !interaction.isRepliable()) {
            throw new Error("Interaction must be repliable. Please check the interaction is repliable interaction.");
        }
        if (options.followUp && !interaction.followUp) {
            throw new Error("Interaction must have the followUp() function. Please check the interaction is followUp-able.");
        }

        const params = { ...(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex)), fetchReply: true, ephemeral: options.ephemeral };
        this.sentMessage = options.followUp ? await interaction.followUp(params)
            : options.edit ? await interaction.editReply(params)
                : await interaction.reply(params) as unknown as Message;
        this.usedInteraction = interaction;

        this._manageActions({ newIndex: this.currentPageIndex, registerPageActions: true });
        this._updateReactions();

        return this.sentMessage;
    }

    /**
     * @param options
     */
    async destroy(options: { autoRemoveReaction?: boolean } = {}) {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        const msg = this.sentMessage;
        if (!msg) return;

        options = bindOptions({ autoRemoveReaction: false }, options);

        (await this._getPage(this.currentPageIndex)).removeApply(msg, { autoRemoveReaction: false });
        const emojiActions = this.pageActions.flatMap(row => row.filter((a): a is EmojiAction => a instanceof EmojiAction));
        emojiActions.forEach(action => action.removeApply(msg, { autoRemoveReaction: false }));

        if (options.autoRemoveReaction) await msg.reactions.removeAll();
    }

    /**
     * @param index
     */
    async gotoPage(index: number) {
        if (this.isDestroyed) throw new Error("This MessagePages has already been destroyed.");
        if (!this.isSent) throw new Error("This MessagePages hasn't been sent yet. Please send it first.");
        if (index < 0 || index >= this.messageCores.length) throw new Error(`Index out of bounds: Receive ${index} as index. Expected index 0-${this.messageCores.length - 1}.`);

        const oldIndex = this.currentPageIndex;
        if (oldIndex === index && typeof this.messageCores[index] !== "function") return;
        this.currentPageIndex = index;

        if (this.sentMessage) {
            await this.sentMessage.edit(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));
        } else {
            await this.usedInteraction?.editReply(await this._getMessageCreateOptionsWithComponents(this.currentPageIndex));
        }
        this._manageActions({ oldIndex: oldIndex, newIndex: this.currentPageIndex, registerPageActions: false });
        this._updateReactions();
    }

    /**
     * @param actionType
     */
    async takeAction(interaction: MessageComponentInteraction | null, actionType: typeof actionsList[number]) {
        if (interaction) await interaction.deferUpdate();
        switch (actionType) {
            case "FIRST":
                await this.gotoPage(0);
                break;
            case "BACK":
                await this.gotoPage(Math.max(this.currentPageIndex - 1, 0));
                break;
            case "NEXT":
                await this.gotoPage(Math.min(this.currentPageIndex + 1, this.messageCores.length - 1));
                break;
            case "LAST":
                await this.gotoPage(this.messageCores.length - 1);
        }
    }

    /**
     * @param index
     */
    async _getMessageCreateOptionsWithComponents(index: number): Promise<BaseMessageOptions> {
        const messageCreateOptions = { ...(await this._getPage(index)).getMessage() }; // make immutable
        messageCreateOptions.components ??= [];

        for (let row of this.pageActions) {
            row = row.filter(a => !(a instanceof EmojiAction));
            if (row.every((a): a is ButtonAction => a instanceof ButtonAction)) {
                messageCreateOptions.components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...row.map(b => {
                    if (b instanceof PageButtonAction) {
                        const isDisabled = ((b.pageActionType === "BACK" || b.pageActionType === "FIRST") && index === 0) || ((b.pageActionType === "NEXT" || b.pageActionType === "LAST") && index === this.messageCores.length - 1);
                        return b.getButton().setDisabled(isDisabled);
                    }
                    return b.getButton();
                })));
            } else if (row.length === 1 && row[0] instanceof SelectMenuAction) {
                const selectMenu = row[0] as SelectMenuAction;
                messageCreateOptions.components.push(new ActionRowBuilder<typeof selectMenu["selectMenu"]>().addComponents(selectMenu.selectMenu));
            } else {
                throw new Error("Each row in pageActions must be only buttons or just a select menu.");
            }
        }
        return messageCreateOptions;
    }

    /**
     * @param index
     */
    async _getPage(index: number): Promise<MessageCore> {
        const page = this.messageCores[index];
        const messageCore = typeof page === "function" ? await page() : page;
        return messageCore;
    }

    /**
     * @param options
     */
    async _manageActions(options: { oldIndex?: number, newIndex: number, registerPageActions: boolean }) {
        const sentMessage = this.sentMessage;
        if (!sentMessage) return;
        if (options.oldIndex !== undefined) {
            const oldPage = await this._getPage(options.oldIndex);
            oldPage.removeApply(sentMessage, { autoRemoveReaction: false, fastMode: false });
        }

        const newPage = await this._getPage(options.newIndex);
        newPage.apply(sentMessage, { autoReact: false });

        if (options.registerPageActions) {
            const actions = this.pageActions.flat();
            for (const action of actions) {
                if (action instanceof EmojiAction) {
                    action.apply(sentMessage, { autoReact: false });
                } else {
                    action.register();
                }
            }
        }
    }

    /**
     * Updates reactions at the sent MessagePages message for current page
     */
    async _updateReactions() {
        const sentMessage = this.sentMessage;
        if (!sentMessage) return;

        const emojis = await this._getEmojis(this.currentPageIndex);

        // get all reactions that the client bot added to the sent message
        const currentReactions = [...sentMessage.reactions.cache.filter(reaction => reaction.users.resolve(sentMessage.author.id)).values()];

        let matchedCount = 0;
        for (let i = 0; i < emojis.length; i++) {
            if (emojis[i] !== currentReactions[i]?.emoji.name) {
                matchedCount = i;
                break;
            }
        }
        const stepCountWithoutRemoveAll = (currentReactions.length - matchedCount) + (currentReactions.length - matchedCount);

        const stepCountWithRemoveAll = 1 + emojis.length;

        // if the number of steps is the same, update reactions without remove-all.
        // since remove-all removes all reactions including ones not from the bot.
        const useRemoveAll = stepCountWithRemoveAll < stepCountWithoutRemoveAll;

        if (useRemoveAll) {
            await sentMessage.reactions.removeAll();
            for (const emoji of emojis) {
                await sentMessage.react(emoji);
            }
        } else {
            const reactionsToRemove: MessageReaction[] = currentReactions.slice(matchedCount);
            const emojisToAdd: string[] = emojis.slice(matchedCount);
            for (const reaction of reactionsToRemove) {
                await reaction.remove();
            }
            for (const emoji of emojisToAdd) {
                await sentMessage.react(emoji);
            }
        }
    }

    /**
     * Gets necessary emojis for the page
     * @param index
     */
    async _getEmojis(index: number): Promise<string[]> {
        const emojis = [];
        const messageCore = await this._getPage(index);
        emojis.push(...this.pageActions.flatMap(row => row.filter((a): a is EmojiAction => a instanceof EmojiAction).map(e => e.emoji)));
        emojis.push(...messageCore.getEmojis());
        return emojis;
    }
}