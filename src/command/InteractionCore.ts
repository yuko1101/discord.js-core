/*
    This does not the same as the Interaction does.
    For example, deferReply() -> followUp() -> deleteReply() will not work.
    To do that, you need to use deleteFollowUp() instead of deleteReply().
    There is more examples below.

    ======[Editing Follow-Ups That Sent After Deferred]======
    deferReply() -> followUp() -> editReply()
    This will try to edit defer-reply.
    To edit the follow-up message, you need to do as the following:
    deferReply() -> followUp() -> editFollowUp()
    =========================================================

 */

import { BaseMessageOptions, If, InteractionResponse, Message, RepliableInteraction, User } from "discord.js";
import MessagePages from "../message/MessagePages";
import { bindOptions } from "config_file.js";
import { removeAllReactions } from "../utils/permission_utils";
import { FlexibleMessageOptions, convertToMessageOptions } from "../message/MessageOptions";

export enum SourceType {
    INTERACTION = "INTERACTION",
    MESSAGE = "MESSAGE",
}

export type IfInteraction<S, T, F> = If<S extends SourceType.INTERACTION ? true : false, T, F>;

export type MessageSource = FlexibleMessageOptions<BaseMessageOptions> | MessagePages;

export type Source<T extends SourceType> = IfInteraction<T, RepliableInteraction, Message>;
export type IsEphemeralBySourceType<T extends SourceType> = IfInteraction<T, boolean, false>;

/** For INTERACTION, the sent message can be ephemeral. */
export type SentMessageType<T extends SourceType> = IfInteraction<T, InteractionResponse, Message>;
export type SentDataContainerType<T extends SourceType, Deferred extends boolean> = IfInteraction<T, InteractionResponseDataContainer<Deferred>, MessageDataContainer<Deferred>>;

export default class InteractionCore<T extends SourceType = SourceType> {
    readonly sourceType: T;
    readonly source: Source<T>;
    readonly user: User;

    replyMessage: SentDataContainerType<T, boolean> | null = null;
    followUpMessage: SentDataContainerType<T, boolean> | null = null;

    constructor(source: Source<T>) {
        this.source = source;
        this.sourceType = (source instanceof Message ? SourceType.MESSAGE : SourceType.INTERACTION) as T;

        this.user = this.run({
            withInteraction(ic) {
                return ic.source.user;
            },
            withMessage(ic) {
                return ic.source.author;
            },
        });
    }

    /** target user of UserContextMenu */
    get contextMenuUser(): User | null {
        if (this.hasInteraction()) {
            if (this.source.isUserContextMenuCommand()) {
                return this.source.targetUser;
            }
        }
        return null;
    }

    /** target message of MessageContextMenu */
    get contextMenuMessage(): Message | null {
        if (this.hasInteraction()) {
            if (this.source.isMessageContextMenuCommand()) {
                return this.source.targetMessage;
            }
        }
        return null;
    }

    get firstReplyMessage() {
        return this.replyMessage ?? this.followUpMessage;
    }

    get lastReplyMessage() {
        return this.followUpMessage ?? this.replyMessage;
    }

    get isReplied() {
        return this.replyMessage !== null;
    }

    get isDeferred() {
        return this.replyMessage !== null && this.replyMessage.msgSrc === null && this.followUpMessage === null;
    }

    hasInteraction(): this is InteractionCore<SourceType.INTERACTION> {
        return !this.hasMessage();
    }

    hasMessage(): this is InteractionCore<SourceType.MESSAGE> {
        return this.source instanceof Message;
    }

    run<U>(data: { withInteraction: (ic: InteractionCore<SourceType.INTERACTION>) => U, withMessage: (ic: InteractionCore<SourceType.MESSAGE>) => U }): U {
        if (this.hasInteraction()) {
            return data.withInteraction(this);
        } else if (this.hasMessage()) {
            return data.withMessage(this);
        } else {
            throw new Error("This error cannot be happened.");
        }
    }

    async deferReply(options: { ephemeral?: boolean } = {}): Promise<SentDataContainerType<T, true>> {
        const opt = bindOptions({ ephemeral: false }, options);
        if (this.isReplied) throw new Error("You can't defer a `InteractionCore` after it has replied");
        // TODO: block ephemeral reply if this instance is InteractionCore<false>

        const interactionResponse = await this.run<Promise<InteractionResponse | null>>({
            async withMessage(ic) {
                await ic.source.channel.sendTyping();
                return null;
            },
            async withInteraction(ic) {
                return await ic.source.deferReply({ ephemeral: opt.ephemeral });
            },
        });

        if (this.sourceType === SourceType.INTERACTION) {
            const sdc = new InteractionResponseDataContainer({ msgSrc: null, interactionResponse: interactionResponse as InteractionResponse, ephemeral: opt.ephemeral });
            (this as InteractionCore<SourceType.INTERACTION>).replyMessage = sdc;
            return sdc as SentDataContainerType<T, true>;
        } else {
            const sdc = new MessageDataContainer({ msg: null, msgSrc: null });
            (this as InteractionCore<SourceType.MESSAGE>).replyMessage = sdc;
            return sdc as SentDataContainerType<T, true>;
        }
    }

    async reply(msgSrc: MessageSource, options: { ephemeral?: boolean } = {}): Promise<SentDataContainer<false>> {
        const opt = bindOptions({ ephemeral: false }, options);
        if (this.isReplied) throw new Error("You can't reply twice");
        // TODO: block ephemeral reply if this instance is InteractionCore<false>

        const msg = await (async () => {
            if (this.hasMessage()) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else if ("actions" in msgSrc) {
                    return await this.source.reply(convertToMessageOptions(msgSrc));
                    // TODO: manage actions and emojis
                } else {
                    return await this.source.reply(msgSrc);
                }
            } else if (this.hasInteraction()) {
                if (msgSrc instanceof MessagePages) {
                    return await msgSrc.send(this.source) as InteractionResponse;
                } else if ("actions" in msgSrc) {
                    return await this.source.reply({ ...convertToMessageOptions(msgSrc), ephemeral: opt.ephemeral, fetchReply: false });
                    // TODO: manage actions and emojis
                } else {
                    return await this.source.reply({ ...msgSrc, ephemeral: opt.ephemeral, fetchReply: false });
                }
            } else {
                throw new Error("This error cannot be happened.");
            }
        })() as SentMessageType<T>;

        if (this.hasInteraction()) {
            const sdc = new InteractionResponseDataContainer<false>({ msgSrc, ephemeral: opt.ephemeral, interactionResponse: msg as InteractionResponse });
            (this as InteractionCore<SourceType.INTERACTION>).replyMessage = sdc;
            return sdc as SentDataContainerType<T, false>;
        } else {
            const sdc = new MessageDataContainer({ msg: msg as Message, msgSrc });
            (this as InteractionCore<SourceType.MESSAGE>).replyMessage = sdc;
            return sdc as SentDataContainerType<T, false>;
        }
    }

    async editReply(msgSrc: MessageSource): Promise<SentDataContainer<false>> {
        const msgToEdit = this.lastReplyMessage;
        if (!msgToEdit) throw new Error("You cannot edit your reply or follow-up before it is sent.");

        if (msgToEdit.isNotDeferred()) {
            // destroy the previous reply message
            if (msgToEdit.msgSrc instanceof MessagePages) {
                // TODO
            } else if ("actions" in msgToEdit.msgSrc) {
                // TODO
            } else {
                // do nothing with MessageCreateOptions
            }

            // remove all reactions from the previous message
            const oldMsg = await msgToEdit.resolve();
            if (oldMsg) await removeAllReactions(oldMsg);
        }

        const msg = await (async () => {
            if (this.hasMessage()) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else if ("actions" in msgSrc) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else {
                    if (!msgToEdit.isMessage() || !msgToEdit.isNotDeferred()) throw new Error("This error cannot be happened.");
                    return await msgToEdit.msg.edit(msgSrc);
                }
            } else if (this.hasInteraction()) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else if ("actions" in msgSrc) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else {
                    // TODO
                    throw new Error("Not implemented yet.");
                }
            } else {
                throw new Error("This error cannot be happened.");
            }
        })() as SentMessageType<T>;

        msgToEdit.msgSrc = msgSrc;
        msgToEdit.deferred = false;
        if (!msgToEdit.isNotDeferred()) throw new Error("This error cannot be happened.");

        if (msgToEdit.isInteraction()) {
            msgToEdit.response = msg as InteractionResponse;
            msgToEdit.msg = null;
        } else {
            msgToEdit.msg = msg as Message;
        }

        return msgToEdit;
    }

    /**
     * @throws an error if unable to delete the reply.
     */
    async deleteReply() {
        const msgToDelete = this.lastReplyMessage;
        if (!msgToDelete) throw new Error("You cannot delete your reply or follow-up before it is sent.");
        // TODO: clarify if this is correct
        if (!msgToDelete.isNotDeferred()) throw new Error("You can't delete a deferred reply.");
        if (msgToDelete.isDeletable()) throw new Error("You can't delete this message. Please check if it's deletable before trying to delete it.");

        await this.run({
            async withMessage(ic) {
                const toDelete = ic.lastReplyMessage;
                if (!toDelete || !toDelete.isMessage() || !toDelete.isNotDeferred()) throw new Error("This error cannot be happened.");
                await toDelete.msg.delete();
            },
            async withInteraction(ic) {
                await ic.source.deleteReply();
            },
        });

        msgToDelete.deleted = true;
    }

    async followUp(msgSrc: MessageSource, options: { ephemeral?: boolean } = {}): Promise<SentDataContainer<false>> {
        const opt = bindOptions({ ephemeral: false }, options);
        // TODO: block ephemeral reply if this instance is InteractionCore<false>

        if (!this.replyMessage) throw new Error("You must reply before following up.");
        if (this.followUpMessage) throw new Error("You can't follow up twice.");

        const msg = await (async () => {
            if (this.hasMessage()) {
                const sendMessage: (data: BaseMessageOptions) => Promise<Message> =
                    this.isDeferred ?
                        async (data) => this.source.reply(data) :
                        async (data) => this.replyMessage?.msg?.reply(data) as Promise<Message>;

                if (msgSrc instanceof MessagePages) {
                    // TODO
                    throw new Error("Not implemented yet.");
                } else if ("actions" in msgSrc) {
                    return await sendMessage(convertToMessageOptions(msgSrc));
                    // TODO: manage actions and emojis
                } else {
                    return await sendMessage(msgSrc);
                }
            } else if (this.hasInteraction()) {
                if (msgSrc instanceof MessagePages) {
                    return await msgSrc.send(this.source, true) as InteractionResponse;
                } else if ("actions" in msgSrc) {
                    return await this.source.followUp({ ...convertToMessageOptions(msgSrc), ephemeral: opt.ephemeral });
                    // TODO: manage actions and emojis
                } else {
                    return await this.source.followUp({ ...msgSrc, ephemeral: opt.ephemeral });
                }
            } else {
                throw new Error("This error cannot be happened.");
            }
        })() as SentMessageType<T>;

        // TODO: check if the ephemeral is correct
        const ephemeral = (this.isDeferred && this.replyMessage.isEphemeral()) || opt.ephemeral;

        if (this.hasInteraction()) {
            const sdc = new InteractionResponseDataContainer<false>({ msgSrc, ephemeral, interactionResponse: msg as InteractionResponse });
            (this as InteractionCore<SourceType.INTERACTION>).followUpMessage = sdc;
            return sdc as SentDataContainerType<T, false>;
        } else {
            const sdc = new MessageDataContainer({ msg: msg as Message, msgSrc });
            (this as InteractionCore<SourceType.MESSAGE>).followUpMessage = sdc;
            return sdc as SentDataContainerType<T, false>;
        }
    }

    // TODO: add editFollowUp, deleteFollowUp, and more
}

interface SentDataContainer<Deferred extends boolean> {
    msg: Message | null;
    msgSrc: Deferred extends true ? null : MessageSource;
    deleted: boolean;

    deferred: Deferred;

    isDeferred(): this is SentDataContainer<true>;
    isNotDeferred(): this is SentDataContainer<false>;
    isEphemeral(): boolean;
    isDeletable(): boolean;

    isMessage(): this is MessageDataContainer<Deferred>;
    isInteraction(): this is InteractionResponseDataContainer<Deferred>;

    resolve(): Promise<Message | null>;
}

class MessageDataContainer<Deferred extends boolean = boolean> implements SentDataContainer<Deferred> {
    msg: Deferred extends true ? null : Message;
    msgSrc: Deferred extends true ? null : MessageSource;
    deleted = false;

    deferred: Deferred;

    constructor({ msg, msgSrc }: { msg: Deferred extends true ? null : Message, msgSrc: Deferred extends true ? null : MessageSource }) {
        this.msg = msg;
        this.msgSrc = msgSrc;
        this.deferred = (msgSrc === null) as Deferred;
    }

    isDeferred(): this is MessageDataContainer<true> {
        throw new Error("Method not implemented.");
    }

    isNotDeferred(): this is MessageDataContainer<false> {
        throw new Error("Method not implemented.");
    }

    isEphemeral(): boolean {
        return false;
    }

    isDeletable(): boolean {
        return !this.deferred && !this.deleted && this.msg !== null && this.msg.deletable;
    }

    isMessage(): this is MessageDataContainer<Deferred> {
        return true;
    }

    isInteraction(): this is InteractionResponseDataContainer<Deferred> {
        return false;
    }

    async resolve(): Promise<Message | null> {
        return this.msg;
    }
}

class InteractionResponseDataContainer<Deferred extends boolean = boolean> implements SentDataContainer<Deferred> {
    msg: Deferred extends false ? Message | null : null = null;
    msgSrc: Deferred extends true ? null : MessageSource;
    response: InteractionResponse;
    ephemeral: boolean;
    deleted = false;

    deferred: Deferred;

    constructor({ msgSrc, interactionResponse, ephemeral }: { msgSrc: Deferred extends true ? null : MessageSource, interactionResponse: InteractionResponse, ephemeral: boolean }) {
        this.msgSrc = msgSrc;
        this.response = interactionResponse;
        this.ephemeral = ephemeral;
        this.deferred = (msgSrc === null) as Deferred;
    }

    isDeferred(): this is InteractionResponseDataContainer<true> {
        return this.msgSrc === null;
    }

    isNotDeferred(): this is InteractionResponseDataContainer<false> {
        return this.msgSrc !== null;
    }

    isEphemeral(): boolean {
        return this.ephemeral;
    }

    isDeletable(): boolean {
        return !this.deleted;
    }

    isMessage(): this is MessageDataContainer<Deferred> {
        return false;
    }

    isInteraction(): this is InteractionResponseDataContainer<Deferred> {
        return true;
    }

    async resolve(): Promise<Message | null> {
        if (this.msg) return this.msg;
        if (this.isDeferred() || this.isEphemeral()) return null;

        const fetched = await this.response.fetch();

        (this as InteractionResponseDataContainer<false>).msg = fetched;
        return fetched;
    }
}