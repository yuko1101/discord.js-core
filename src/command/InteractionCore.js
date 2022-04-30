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

const { CommandInteraction, Message, TextBasedChannel, Guild, GuildMember, User, MessageOptions } = require("discord.js");
const { bindOptions } = require("../utils/utils");

module.exports = class InteractionCore {
    /**
     * @param {object} data
     * @param {Message | null} data.msg
     * @param {CommandInteraction | null} data.interaction
     */
    constructor(data) {
        /** @readonly @type {Message | null} */
        this.msg = data.msg;
        /** @readonly @type {CommandInteraction | null} */
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

        /** @readonly @type {Message | null} */
        this.followUpMessage = null;

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
     * @param {MessageOptions} messageOptions 
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async reply(messageOptions, options = {}) {
        options = bindOptions({ fetchReply: true, ephemeral: false }, options);
        if (this.deferred) throw new Error("You cannot reply to a message after deferring it. Consider using `followUp` instead.");
        if (this.replied) throw new Error("You can't reply twice");
        if (!this.hasInteraction) {
            this.replyMessage = await this.msg.reply(messageOptions);
        } else {
            const message = await this.interaction.reply({ ...messageOptions, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
            if (options.fetchReply) {
                this.replyMessage = message;
            }
        }
        this.replied = true;
        this.isReplyMessageSentAsEphemeral = options.ephemeral;
        return this.replyMessage;
    }

    /**
     * @param {*} messageOptions 
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async editReply(messageOptions, options = {}) {
        options = bindOptions({ fetchReply: true }, options);
        if (!this.hasInteraction) {
            if (!this.replyMessage) {
                throw new Error("You must reply to a message before editing it");
            }
            this.replyMessage = await this.replyMessage.edit(messageOptions);
        } else {
            const message = await this.interaction.editReply({ ...messageOptions, fetchReply: options.fetchReply });
            if (options.fetchReply) {
                this.replyMessage = message;
            }
        }
        return this.replyMessage;
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
     * @param {MessageOptions} messageOptions
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @param {boolean} [options.ephemeral=false] Whether to send the message as ephemeral (Only for slash command)
     * @param {boolean} [options.reply=true] Whether to reply to the previous message (Only for message command. If deferred the InteractionCore, this option is ignored)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async followUp(messageOptions, options = {}) {
        options = bindOptions({ fetchReply: true, ephemeral: false, reply: true }, options);
        if (!this.hasInteraction) {
            if (!this.replyMessage && !this.deferred) throw new Error("You must reply to a message before following up to it");
            if (this.deferred) {
                this.followUpMessage = await this.msg.reply(messageOptions);
            } else {
                this.followUpMessage = options.reply ? await this.replyMessage.reply(messageOptions) : await this.msg.channel.send(messageOptions);
            }

        } else {
            const message = await this.interaction.followUp({ ...messageOptions, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
            if (options.fetchReply) {
                this.followUpMessage = message;
            }
        }
        this.followedUp = true;
        if (this.deferred && this.isReplyMessageSentAsEphemeral === true) {
            this.isFollowUpMessageSentAsEphemeral = true;
        } else {
            this.isFollowUpMessageSentAsEphemeral = options.ephemeral;
        }
        return this.followUpMessage;
    }

    // TODO: add editFollowUp, deleteFollowUp, sendPages, and more
}