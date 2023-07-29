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
import MessageCore from "../message/MessageCore";
import { bindOptions } from "config_file.js";
import { removeAllReactions } from "../utils/permission_utils";

/** @typedef */
export type MessageSource = BaseMessageOptions | MessageCore | MessagePages;

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
    replyMessage: Message | null;
    /**  */
    replyMessageData: MessageSource | null;
    /**  */
    followUpMessage: Message | null;
    /**  */
    followUpMessageData: MessageSource | null;
    /**  */
    deferred: boolean;
    /**  */
    replied: boolean;
    /**  */
    followedUp: boolean;
    /**  */
    isReplyMessageSentAsEphemeral: boolean | null;
    /**  */
    isFollowUpMessageSentAsEphemeral: boolean | null;
    /**  */
    isReplyMessageDeleted: boolean;

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

        /* Data */

        this.replyMessage = null;

        this.replyMessageData = null;

        this.followUpMessage = null;

        this.followUpMessageData = null;

        this.deferred = false;

        this.replied = false;

        this.followedUp = false;

        this.isReplyMessageSentAsEphemeral = null;

        this.isFollowUpMessageSentAsEphemeral = null;

        this.isReplyMessageDeleted = false;
    }

    hasInteraction(): this is InteractionCore<"INTERACTION"> {
        return !this.hasMessage();
    }

    hasMessage(): this is InteractionCore<"MESSAGE"> {
        return this.source instanceof Message;
    }

    run<U>(data: { withInteraction: (ic: InteractionCore<"INTERACTION">) => U, withMessage: (ic: InteractionCore<"MESSAGE">) => U }): U {
        return this.hasInteraction() ? data.withInteraction(this) : data.withMessage(this as InteractionCore<"MESSAGE">);
    }

    /**
     * @param options
     */
    async deferReply(options: { fetchReply?: boolean, ephemeral?: boolean } = {}) {
        options = bindOptions({ fetchReply: false, ephemeral: false }, options);
        if (this.deferred) throw new Error("You can't defer a `InteractionCore` twice");
        if (this.replied) throw new Error("You can't defer a `InteractionCore` after it has replied");
        await this.run({
            async withMessage(ic) {
                await ic.source.channel.sendTyping();
            },
            async withInteraction(ic) {
                await ic.source.deferReply({ fetchReply: options.fetchReply, ephemeral: options.ephemeral });
            },
        });
        this.deferred = true;
        this.replied = true;
        this.isReplyMessageSentAsEphemeral = options.ephemeral ?? null;
    }

    /**  */
    async reply(msgSrc: MessageSource, options: { ephemeral?: boolean } = {}): Promise<Message> {
        options = bindOptions({ ephemeral: false }, options);
        if (this.deferred) throw new Error("You cannot reply to a message after deferring it. Consider using `followUp` instead.");
        if (this.replied) throw new Error("You can't reply twice");
        await this.run({
            async withMessage(ic) {
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    ic.replyMessage = await ic.source.reply(msgSrc.getMessage());
                    msgSrc.apply(ic.replyMessage);
                } else if (msgSrc instanceof MessagePages) {
                    ic.replyMessage = await msgSrc.sendTo(ic.source);
                } else {
                    ic.replyMessage = await ic.source.reply(msgSrc);
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    const sent = await ic.source.reply({ ...msgSrc.getMessage(), ephemeral: options.ephemeral, fetchReply: true });
                    ic.replyMessage = sent;
                    msgSrc.apply(sent);
                } else if (msgSrc instanceof MessagePages) {
                    const sent = await msgSrc.interactionReply(ic.source, { ephemeral: options.ephemeral });
                    ic.replyMessage = sent;
                } else {
                    const sent = await ic.source.reply({ ...msgSrc, ephemeral: options.ephemeral, fetchReply: true });
                    ic.replyMessage = sent;
                }
            },
        });
        this.replied = true;
        this.isReplyMessageSentAsEphemeral = options.ephemeral as boolean;
        this.replyMessageData = msgSrc;

        return this.replyMessage as Message;
    }


    // These getters and setters are for editReply
    // These get or set the first message which is not a deferring.

    public get firstReplyMessage() {
        return this.deferred ? this.followUpMessage : this.replyMessage;
    }
    public set firstReplyMessage(message: Message | null) {
        if (this.deferred) {
            this.followUpMessage = message;
        } else {
            this.replyMessage = message;
        }
    }
    public get firstReplyMessageData() {
        return this.deferred ? this.followUpMessageData : this.replyMessageData;
    }
    public set firstReplyMessageData(messageData: MessageSource | null) {
        if (this.deferred) {
            this.followUpMessageData = messageData;
        } else {
            this.replyMessageData = messageData;
        }
    }


    /**  */
    async editReply(msgSrc: MessageSource) {
        if (!this.firstReplyMessage) throw new Error("You cannot edit your reply or follow-up before it is sent.");

        const isEditingMessageEphemeral = this.isFollowUpMessageSentAsEphemeral ?? this.isReplyMessageSentAsEphemeral;

        if (this.firstReplyMessageData instanceof MessageCore) {
            await this.firstReplyMessageData.removeApply(this.firstReplyMessage, { fastMode: true, autoRemoveReaction: false });
        } else if (this.firstReplyMessageData instanceof MessagePages) {
            await this.firstReplyMessageData.destroy();
        } else {
            // do nothing with MessageCreateOptions
        }
        if (!isEditingMessageEphemeral) {
            await removeAllReactions(this.firstReplyMessage);
        }

        await this.run({
            async withMessage(ic) {
                if (!ic.firstReplyMessage) throw new Error("This error cannot be happened.");
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    ic.firstReplyMessage = await ic.firstReplyMessage.edit(msgSrc.getMessage());
                    msgSrc.apply(ic.firstReplyMessage);
                } else if (msgSrc instanceof MessagePages) {
                    ic.firstReplyMessage = await msgSrc.sendTo(ic.source, { edit: true });
                } else {
                    ic.firstReplyMessage = await ic.firstReplyMessage.edit(msgSrc);
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    const sent = await ic.source.editReply(msgSrc.getMessage());
                    ic.firstReplyMessage = sent;
                    msgSrc.apply(sent);
                } else if (msgSrc instanceof MessagePages) {
                    const sent = await msgSrc.interactionReply(ic.source, { edit: true });
                    ic.firstReplyMessage = sent;
                } else {
                    const message = await ic.source.editReply(msgSrc);
                    ic.firstReplyMessage = message;
                }
            },
        });
        this.firstReplyMessageData = msgSrc;
        return this.firstReplyMessage;
    }

    /**
     * @throws an error if unable to delete the reply.
     */
    async deleteReply() {
        if (this.isReplyMessageDeleted) throw new Error("You can't delete a reply that has already been deleted.");
        await this.run({
            async withMessage(ic) {
                if (!ic.replyMessage) {
                    throw new Error("You must reply to a message before deleting it");
                }
                if (!ic.replyMessage.deletable) throw new Error("You can't delete this message. Please check if it's deletable before trying to delete it.");
                await ic.replyMessage.delete();
                ic.isReplyMessageDeleted = true;
            },
            async withInteraction(ic) {
                await ic.source.deleteReply();
                ic.isReplyMessageDeleted = true;
            },
        });
    }

    /**
     * @param msgSrc
     * @param options
     */
    async followUp(msgSrc: MessageSource, options: { ephemeral?: boolean, reply?: boolean } = {}): Promise<Message> {
        options = bindOptions({ ephemeral: false, reply: true }, options);
        options.reply = options.reply || this.deferred;
        this.run({
            async withMessage(ic) {
                if (!ic.replyMessage && !ic.deferred) throw new Error("You must reply to a message before following up to it");
                const sendFunction = async (messageOptions: BaseMessageOptions) => {
                    return await (options.reply ? ic.source.reply(messageOptions) : ic.source.channel.send(messageOptions));
                };
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    ic.followUpMessage = await sendFunction(msgSrc.getMessage());
                    msgSrc.apply(ic.followUpMessage);
                } else if (msgSrc instanceof MessagePages) {
                    ic.followUpMessage = await msgSrc.sendTo(ic.source);
                } else {
                    ic.followUpMessage = await sendFunction(msgSrc);
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessageCore) {
                    msgSrc.buttonActions.forEach(array => array.forEach(action => action.register()));
                    const sent = await ic.source.followUp({ ...msgSrc.getMessage(), ephemeral: options.ephemeral });
                    ic.followUpMessage = sent;
                    msgSrc.apply(sent);
                } else if (msgSrc instanceof MessagePages) {
                    const sent = await msgSrc.interactionReply(ic.source, { ephemeral: options.ephemeral, followUp: true });
                    ic.followUpMessage = sent;
                } else {
                    const sent = await ic.source.followUp({ ...msgSrc, ephemeral: options.ephemeral });
                    ic.followUpMessage = sent;
                }
            },
        });

        this.followedUp = true;
        if (this.deferred && this.isReplyMessageSentAsEphemeral === true) {
            this.isFollowUpMessageSentAsEphemeral = true;
        } else {
            this.isFollowUpMessageSentAsEphemeral = options.ephemeral as boolean;
        }
        this.followUpMessageData = msgSrc;
        return this.followUpMessage as Message;
    }

    // TODO: add editFollowUp, deleteFollowUp, and more
}