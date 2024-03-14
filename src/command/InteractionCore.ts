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

    /** target user of UserContextMenu */
    public get contextMenuUser(): User | null {
        if (this.hasInteraction()) {
            if (this.source.isUserContextMenuCommand()) {
                return this.source.targetUser;
            }
        }
        return null;
    }

    /** target message of MessageContextMenu */
    public get contextMenuMessage(): Message | null {
        if (this.hasInteraction()) {
            if (this.source.isMessageContextMenuCommand()) {
                return this.source.targetMessage;
            }
        }
        return null;
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
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    ic.replyMessage = await ic.source.reply(convertToMessageOptions(msgSrc));
                    // TODO: manage actions and emojis
                } else {
                    ic.replyMessage = await ic.source.reply(msgSrc);
                }
            },
            async withInteraction(ic) {
                if (msgSrc instanceof MessagePages) {
                    // TODO
                } else if ("actions" in msgSrc) {
                    ic.replyMessage = await ic.source.reply({ ...convertToMessageOptions(msgSrc), ephemeral: options.ephemeral, fetchReply: true });
                    // TODO: manage actions and emojis
                } else {
                    ic.replyMessage = await ic.source.reply({ ...msgSrc, ephemeral: options.ephemeral, fetchReply: true });

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
        if (!this.firstReplyMessage || !this.firstReplyMessageData) throw new Error("You cannot edit your reply or follow-up before it is sent.");

        const isEditingMessageEphemeral = this.isFollowUpMessageSentAsEphemeral ?? this.isReplyMessageSentAsEphemeral;

        // destroy the previous reply message
        if (this.firstReplyMessageData instanceof MessagePages) {
            // TODO
        } else if ("actions" in this.firstReplyMessageData) {
            // TODO
        } else {
            // do nothing with MessageCreateOptions
        }
        if (!isEditingMessageEphemeral) {
            await removeAllReactions(this.firstReplyMessage);
        }

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