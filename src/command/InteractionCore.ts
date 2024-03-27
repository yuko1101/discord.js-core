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

import { BaseMessageOptions, Message, RepliableInteraction, User } from "discord.js";
import MessagePages from "../message/MessagePages";
import { bindOptions } from "config_file.js";
import { removeAllReactions } from "../utils/permission_utils";
import { CoreMessageOptions, convertToMessageOptions } from "../message/MessageOptions";

/** @typedef */
export type MessageSource = BaseMessageOptions | CoreMessageOptions<BaseMessageOptions> | MessagePages;

/** @typedef */
export type InteractionCoreType = "MESSAGE" | "INTERACTION";
/** @typedef */
export type InteractionCoreSource<T extends InteractionCoreType> = T extends "INTERACTION" ? RepliableInteraction : Message;

export default class InteractionCore<T extends InteractionCoreType = InteractionCoreType> {
    /**  */
    readonly source: InteractionCoreSource<T>;

    /**  */
    readonly user: User;

    /**  */
    replyMessage: MessageDataContainer<boolean, T extends "MESSAGE" ? false : boolean> | null = null;

    /**  */
    followUpMessage: MessageDataContainer<boolean, T extends "MESSAGE" ? false : boolean> | null = null;

    /**
     * @param source
     */
    constructor(source: InteractionCoreSource<T>) {
        this.source = source;

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

    get isDeferring() {
        return this.replyMessage !== null && this.replyMessage.msgSrc === null && this.followUpMessage === null;
    }

    /**  */
    hasInteraction(): this is InteractionCore<"INTERACTION"> {
        return !this.hasMessage();
    }

    /**  */
    hasMessage(): this is InteractionCore<"MESSAGE"> {
        return this.source instanceof Message;
    }

    /**  */
    run<U>(data: { withInteraction: (ic: InteractionCore<"INTERACTION">) => U, withMessage: (ic: InteractionCore<"MESSAGE">) => U }): U {
        return this.hasInteraction() ? data.withInteraction(this) : data.withMessage(this as InteractionCore<"MESSAGE">);
    }

    /**
     * @param options
     */
    async deferReply(options: { fetchReply?: boolean, ephemeral?: boolean } = {}) {
        const opt = bindOptions({ fetchReply: false, ephemeral: false }, options);
        if (this.isReplied) throw new Error("You can't defer a `InteractionCore` after it has replied");
        // TODO: block ephemeral reply if this instance is InteractionCore<"MESSAGE">

        await this.run({
            async withMessage(ic) {
                await ic.source.channel.sendTyping();
            },
            async withInteraction(ic) {
                await ic.source.deferReply({ fetchReply: opt.fetchReply, ephemeral: opt.ephemeral });
            },
        });
        this.replyMessage = new MessageDataContainer<true>({ msg: null, msgSrc: null, ephemeral: opt.ephemeral }) as MessageDataContainer<true, T extends "MESSAGE" ? false : boolean>;
    }

    /**  */
    async reply(msgSrc: MessageSource, options: { ephemeral?: boolean } = {}): Promise<MessageDataContainer> {
        const opt = bindOptions({ ephemeral: false }, options);
        if (this.isReplied) throw new Error("You can't reply twice");
        // TODO: block ephemeral reply if this instance is InteractionCore<"MESSAGE">

        let msg: Message | null = null;

        await this.run({
            async withMessage(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    msg = await ic.source.reply(convertToMessageOptions(msgSrc));
                    // TODO: manage actions and emojis
                } else {
                    msg = await ic.source.reply(msgSrc);
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    msg = await ic.source.reply({ ...convertToMessageOptions(msgSrc), ephemeral: opt.ephemeral, fetchReply: true });
                    // TODO: manage actions and emojis
                } else {
                    msg = await ic.source.reply({ ...msgSrc, ephemeral: opt.ephemeral, fetchReply: true });

                }
            },
        });

        if (msg === null) throw new Error("This error cannot be happened.");
        const mdc = new MessageDataContainer<false>({ msg, msgSrc, ephemeral: opt.ephemeral });
        this.replyMessage = mdc as MessageDataContainer<false, T extends "MESSAGE" ? false : boolean>;

        return mdc;
    }

    /**  */
    async editReply(msgSrc: MessageSource): Promise<Message> {
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
            if (msgToEdit.isNotEphemeral()) {
                await removeAllReactions(msgToEdit.msg);
            }
        }

        let msg: Message | null = null;

        await this.run({
            async withMessage(ic) {
                if (!ic.firstReplyMessage) throw new Error("This error cannot be happened.");
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    // TODO
                } else {
                    // TODO
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    // TODO
                } else {
                    // TODO
                }
            },
        });

        if (msg === null) throw new Error("This error cannot be happened.");

        msgToEdit.msgSrc = msgSrc;
        msgToEdit.msg = msg;
        return msgToEdit.msg;
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
                if (!toDelete || !toDelete.isNotDeferred()) throw new Error("This error cannot be happened.");
                await toDelete.msg.delete();
            },
            async withInteraction(ic) {
                await ic.source.deleteReply();
            },
        });

        msgToDelete.deleted = true;
    }

    async followUp(msgSrc: MessageSource, options: { ephemeral?: boolean } = {}): Promise<MessageDataContainer> {
        const opt = bindOptions({ ephemeral: false }, options);
        // TODO: block ephemeral reply if this instance is InteractionCore<"MESSAGE">

        if (!this.replyMessage) throw new Error("You must reply before following up.");

        let msg: Message | null = null;

        this.run({
            async withMessage(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    // TODO
                } else {
                    // TODO
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    // TODO
                } else {
                    // TODO
                }
            },
        });

        if (msg === null) throw new Error("This error cannot be happened.");

        // TODO: check if the ephemeral is correct
        const ephemeral = (this.isDeferring && this.replyMessage.ephemeral) || opt.ephemeral;

        const mdc = new MessageDataContainer<false>({ msg, msgSrc, ephemeral });
        this.followUpMessage = mdc as MessageDataContainer<false, T extends "MESSAGE" ? false : boolean>;
        return mdc;
    }

    // TODO: add editFollowUp, deleteFollowUp, and more
}


class MessageDataContainer<Deferred extends boolean = boolean, Ephemeral extends boolean = boolean> {
    msg: Deferred extends false ? Ephemeral extends false ? Message : null : null;
    msgSrc: Deferred extends false ? MessageSource : null;
    ephemeral: Ephemeral;
    deleted = false;

    deferred: Deferred;

    constructor({ msg, msgSrc, ephemeral }: { msg: Deferred extends false ? Ephemeral extends false ? Message : null : null, msgSrc: Deferred extends false ? MessageSource : null, ephemeral: Ephemeral }) {
        this.msg = msg;
        this.msgSrc = msgSrc;
        this.ephemeral = ephemeral;
        this.deferred = (msgSrc === null) as Deferred;
    }

    isDeferred(): this is MessageDataContainer<true, typeof this.ephemeral> {
        return this.msgSrc === null;
    }

    isNotDeferred(): this is MessageDataContainer<false, typeof this.ephemeral> {
        return this.msgSrc !== null;
    }

    isEphemeral(): this is MessageDataContainer<Deferred, true> {
        return this.ephemeral;
    }

    isNotEphemeral(): this is MessageDataContainer<Deferred, false> {
        return !this.ephemeral;
    }

    isDeletable(): boolean {
        return !this.deleted && ((this.msg !== null && this.msg.deletable) || this.ephemeral);
    }
}