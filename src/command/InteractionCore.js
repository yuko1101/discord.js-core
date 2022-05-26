"use strict";

/*
    This does not the same as the Interaction does.
    For example, deferReply() -> followUp() -> deleteReply() will not work. 
    To do that, you need to use deleteFollowUp() instead of deleteReply().
    There is more examples below.

    ======[Editing Follow-Ups That Sent After Deffered]======
    deferReply() -> followUp() -> editReply()
    This will try to edit defer-reply.
    To edit the follow-up message, you need to do as the following:
    deferReply() -> followUp() -> editFollowUp()
    =========================================================



 */

const { Message, TextBasedChannel, Guild, GuildMember, User, MessageOptions, BaseCommandInteraction } = require("discord.js");
const MessageCore = require("../message/MessageCore");
const MessagePages = require("../message/MessagePages");
const { bindOptions } = require("../utils/utils");

module.exports = class InteractionCore {
    /**
     * @param {object} data
     * @param {Message | null} data.msg
     * @param {BaseCommandInteraction | null} data.interaction
     */
    constructor(data) {
        /** @readonly @type {Message | null} */
        this.msg = data.msg;
        /** @readonly @type {BaseCommandInteraction | null} */
        this.interaction = data.interaction;
        /** @readonly @type {boolean} */
        this.hasInteraction = !!data.interaction;


        /** @readonly @type {TextBasedChannel} */
        this.channel = this.hasInteraction ? this.interaction.channel : this.msg.channel;
        /** @readonly @type {Guild} */
        this.guild = this.hasInteraction ? this.interaction.guild : this.msg.guild;
        /** @readonly @type {GuildMember} */
        this.member = this.hasInteraction ? this.interaction.member : this.msg.member;
        /** @readonly @type {User} */
        this.user = this.hasInteraction ? this.interaction.user : this.msg.author;



        /* Data */

        /** @readonly @type {Message | null} */
        this.replyMessage = null;

        /** @private @type {MessageOptions | MessageCore | MessagePages} */
        this.replyMessageData = null;

        /** @readonly @type {Message | null} */
        this.followUpMessage = null;

        /** @private @type {MessageOptions | MessageCore | MessagePages} */
        this.followUpMessageData = null;

        /** @readonly @type {boolean} */
        this.deferred = false;

        /** @readonly @type {boolean} */
        this.replied = false;

        /** @readonly @type {boolean} */
        this.followedUp = false;

        /** @readonly @type {boolean | null} */
        this.isReplyMessageSentAsEphemeral = null;

        /** @readonly @type {boolean | null} */
        this.isFollowUpMessageSentAsEphemeral = null;

        /** @readonly @type {boolean} */
        this.isReplyMessageDeleted = false;
    }

    /**
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=false] Whether to fetch the reply (only for slash command)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (for message command, whether show the typing in the channel)
     */
    async deferReply(options = {}) {
        options = bindOptions({ fetchReply: false, ephemeral: false }, options);
        if (this.deferred) throw new Error("You can't defer a `InteractionCore` twice");
        if (this.replied) throw new Error("You can't defer a `InteractionCore` after it has replied");
        if (!this.hasInteraction) {
            await this.msg.channel.sendTyping();
        } else {
            await this.interaction.deferReply({ fetchReply: options.fetchReply, ephemeral: options.ephemeral });
        }
        this.deferred = true;
        this.replied = true;
        this.isReplyMessageSentAsEphemeral = options.ephemeral;
    }

    /** 
     * @param {MessageOptions | MessageCore | MessagePages} message 
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async reply(message, options = {}) {
        options = bindOptions({ fetchReply: true, ephemeral: false }, options);
        if (this.deferred) throw new Error("You cannot reply to a message after deferring it. Consider using `followUp` instead.");
        if (this.replied) throw new Error("You can't reply twice");
        if (!this.hasInteraction) {
            if (message instanceof MessageCore) {
                message.buttonActions.forEach(array => array.forEach(action => action.register()));
                this.replyMessage = await this.msg.reply(message.getMessage());
                message.apply(this.replyMessage);
            } else if (message instanceof MessagePages) {
                this.replyMessage = await message.sendTo(this.msg);
            } else {
                this.replyMessage = await this.msg.reply(message);
            }
        } else {
            if (message instanceof MessageCore) {
                message.buttonActions.forEach(array => array.forEach(action => action.register()));
                /** @type {void | Message} */
                const sent = await this.interaction.reply({ ...message.getMessage(), fetchReply: options.fetchReply || message.emojiActions.length !== 0, ephemeral: options.ephemeral });
                if (sent) {
                    this.replyMessage = sent;
                    message.apply(sent);
                }
            } else if (message instanceof MessagePages) {
                /** @type {Message} */
                const sent = await message.interactionReply(this.interaction, { ephemeral: options.ephemeral });
                this.replyMessage = sent;
            } else {
                /** @type {void | Message} */
                const sent = await this.interaction.reply({ ...message, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
                if (options.fetchReply) {
                    this.replyMessage = sent;
                }
            }
        }
        this.replied = true;
        this.isReplyMessageSentAsEphemeral = options.ephemeral;
        this.replyMessageData = message;

        return this.replyMessage;
    }

    /**
     * @param {MessageOptions | MessageCore | MessagePages} messageOptions 
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async editReply(messageOptions, options = {}) {
        if (!this.replied || (this.deferred && !this.followedUp)) throw new Error("You can't edit a reply or follow-up before it has been sent");
        options = bindOptions({ fetchReply: true }, options);

        // Separate the cases into reply and follow-up.
        const setReplied = (message) => {
            if (this.deferred) {
                this.followUpMessage = message;
            } else {
                this.replyMessage = message;
            }
        }
        const setRepliedData = (messageData) => {
            if (this.deferred) {
                this.followUpMessageData = messageData;
            } else {
                this.replyMessageData = messageData;
            }
        }
        const getReplied = () => this.deferred ? this.followUpMessage : this.replyMessage;
        const getRepliedData = () => this.deferred ? this.followUpMessageData : this.replyMessageData;

        console.log("repliedMessageData", getRepliedData());
        if (getRepliedData() instanceof MessageCore) {
            await getRepliedData().removeApply(getReplied(), { fastMode: true, autoRemoveReaction: false });
        } else if (getRepliedData() instanceof MessagePages) {
            console.log("destroy");
            await getRepliedData().destroy();
        } else {
            // do nothing with MessageOptions
        }
        if ((getReplied() === undefined || getReplied() === null) && this.hasInteraction) {
            setReplied(await this.interaction.fetchReply());
        }
        console.log(getReplied());
        await getReplied().reactions.removeAll();

        if (!this.hasInteraction) {
            if (!getReplied()) {
                throw new Error("You must reply to a message before editing it");
            }
            if (messageOptions instanceof MessageCore) {
                messageOptions.buttonActions.forEach(array => array.forEach(action => action.register()));
                setReplied(await getReplied().edit(messageOptions.getMessage()));
                messageOptions.apply(getReplied());
            } else if (messageOptions instanceof MessagePages) {
                setReplied(await messageOptions.sendTo(this.msg, { edit: true }));
            } else {
                setReplied(await getReplied().edit(messageOptions));
            }
        } else {
            if (messageOptions instanceof MessageCore) {
                messageOptions.buttonActions.forEach(array => array.forEach(action => action.register()));
                /** @type {void | Message} */
                const sent = await this.interaction.editReply({ ...messageOptions.getMessage(), fetchReply: options.fetchReply || messageOptions.emojiActions.length !== 0 });
                if (sent) {
                    setReplied(sent);
                    messageOptions.apply(sent);
                }
            } else if (messageOptions instanceof MessagePages) {
                /** @type {Message} */
                const sent = await messageOptions.interactionReply(this.interaction, { edit: true });
                setReplied(sent);
            } else {
                const message = await this.interaction.editReply({ ...messageOptions, fetchReply: options.fetchReply });
                if (options.fetchReply) {
                    setReplied(message);
                }
            }
        }
        setRepliedData(messageOptions);
        return getReplied();
    }

    /**
     * @param {object} [options={}]
     * @param {boolean} [showError=false] Whether to show the error stack trace while deleting the reply
     * @returns {boolean} Whether the reply message deleted successfully
     */
    async deleteReply(options = {}) {
        options = bindOptions({ showError: false }, options);
        if (this.isReplyMessageDeleted) throw new Error("You can't delete a reply that has already been deleted.");
        if (!this.hasInteraction) {
            if (!this.replyMessage) {
                throw new Error("You must reply to a message before deleting it");
            }
            if (!this.replyMessage.deletable) throw new Error("You can't delete this message. Please check if it's deletable before trying to delete it.");
            try {
                await this.replyMessage.delete();
                this.isReplyMessageDeleted = true;
                return true
            } catch (e) {
                if (options.showError) {
                    console.error(e);
                }
                return false;
            }
        } else {
            try {
                await this.interaction.deleteReply();
                this.isReplyMessageDeleted = true;
                return true
            } catch (e) {
                if (options.showError) {
                    console.error(e);
                }
                return false;
            }
        }
    }

    /** 
     * @param {MessageOptions | MessageCore | MessagePages} message
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @param {boolean} [options.reply=true] Whether to reply to the previous message (Only for message command. If deferred the InteractionCore, this option is ignored)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async followUp(message, options = {}) {
        options = bindOptions({ fetchReply: true, ephemeral: false, reply: true }, options);
        options.reply = options.reply || this.deferred;
        if (!this.hasInteraction) {
            if (!this.replyMessage && !this.deferred) throw new Error("You must reply to a message before following up to it");
            const sendFunction = async (messageOptions) => {
                return await (options.reply ? this.msg.reply(messageOptions) : this.msg.channel.send(messageOptions));
            }
            if (message instanceof MessageCore) {
                message.buttonActions.forEach(array => array.forEach(action => action.register()));
                this.followUpMessage = await sendFunction(message.getMessage());
                message.apply(this.followUpMessage);
            } else if (message instanceof MessagePages) {
                this.followUpMessage = await message.sendTo(this.msg);
            } else {
                this.followUpMessage = await sendFunction(message);
            }
        } else {
            if (message instanceof MessageCore) {
                message.buttonActions.forEach(array => array.forEach(action => action.register()));
                /** @type {void | Message} */
                const sent = await this.interaction.followUp({ ...message.getMessage(), fetchReply: options.fetchReply || message.emojiActions.length !== 0, ephemeral: options.ephemeral });
                if (sent) {
                    this.followUpMessage = sent;
                    message.apply(sent);
                }
            } else if (message instanceof MessagePages) {
                /** @type {Message} */
                const sent = await message.interactionReply(this.interaction, { ephemeral: options.ephemeral, followUp: true });
                this.followUpMessage = sent;
            } else {
                /** @type {void | Message} */
                const sent = await this.interaction.followUp({ ...message, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
                if (options.fetchReply) {
                    this.followUpMessage = sent;
                }
            }
        }
        this.followedUp = true;
        if (this.deferred && this.isReplyMessageSentAsEphemeral === true) {
            this.isFollowUpMessageSentAsEphemeral = true;
        } else {
            this.isFollowUpMessageSentAsEphemeral = options.ephemeral;
        }
        this.followUpMessageData = message;
        return this.followUpMessage;
    }

    // TODO: add editFollowUp, deleteFollowUp, and more
}