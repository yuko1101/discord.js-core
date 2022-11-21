
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

const { Message, Guild, GuildMember, User, CommandInteraction } = require("discord.js");
const MessageCore = require("../message/MessageCore");
const MessagePages = require("../message/MessagePages");
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


        /** @readonly @type {import("discord.js").TextBasedChannel} */
        this.channel = this.hasInteraction ? this.interaction.channel : this.msg.channel;
        /** @readonly @type {Guild} */
        this.guild = this.hasInteraction ? this.interaction.guild : this.msg.guild;
        /** @readonly @type {GuildMember | import("discord.js").APIInteractionGuildMember} */
        this.member = this.hasInteraction ? this.interaction.member : this.msg.member;
        /** @readonly @type {User} */
        this.user = this.hasInteraction ? this.interaction.user : this.msg.author;
        /** @readonly @type {Date} */
        this.createdAt = this.hasInteraction ? this.interaction.createdAt : this.msg.createdAt;
        /** @readonly @type {number} */
        this.createdTimestamp = this.hasInteraction ? this.interaction.createdTimestamp : this.msg.createdTimestamp;
        /** @readonly @type {string} */
        this.id = this.hasInteraction ? this.interaction.id : this.msg.id;



        /* Data */

        /** @type {Message | null} */
        this.replyMessage = null;

        /** @type {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} */
        this.replyMessageData = null;

        /** @type {Message | null} */
        this.followUpMessage = null;

        /** @type {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} */
        this.followUpMessageData = null;

        /** @type {boolean} */
        this.deferred = false;

        /** @type {boolean} */
        this.replied = false;

        /** @type {boolean} */
        this.followedUp = false;

        /** @type {boolean | null} */
        this.isReplyMessageSentAsEphemeral = null;

        /** @type {boolean | null} */
        this.isFollowUpMessageSentAsEphemeral = null;

        /** @type {boolean} */
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
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} message 
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
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} messageCreateOptions 
     * @param {object} [options={}]
     * @param {boolean} [options.fetchReply=true] Whether to fetch the reply (Only for slash command. Message command returns its reply without this option)
     * @returns {Promise<Message | null>} returns `null` if the option `fetchReply` is `false`
     */
    async editReply(messageCreateOptions, options = {}) {
        if (!this.replied || (this.deferred && !this.followedUp)) throw new Error("You can't edit a reply or follow-up before it has been sent");
        options = bindOptions({ fetchReply: true }, options);

        const isEditingMessageEphemeral = this.isFollowUpMessageSentAsEphemeral ?? this.isReplyMessageSentAsEphemeral;

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

        if (getRepliedData() instanceof MessageCore) {
            await getRepliedData().removeApply(getReplied(), { fastMode: true, autoRemoveReaction: false });
        } else if (getRepliedData() instanceof MessagePages) {
            await getRepliedData().destroy();
        } else {
            // do nothing with MessageCreateOptions
        }
        if ((getReplied() === undefined || getReplied() === null) && this.hasInteraction) {
            setReplied(await this.interaction.fetchReply());
        }
        if (!isEditingMessageEphemeral) await getReplied().reactions.removeAll();

        if (!this.hasInteraction) {
            if (!getReplied()) {
                throw new Error("You must reply to a message before editing it");
            }
            if (messageCreateOptions instanceof MessageCore) {
                messageCreateOptions.buttonActions.forEach(array => array.forEach(action => action.register()));
                setReplied(await getReplied().edit(messageCreateOptions.getMessage()));
                messageCreateOptions.apply(getReplied());
            } else if (messageCreateOptions instanceof MessagePages) {
                setReplied(await messageCreateOptions.sendTo(this.msg, { edit: true }));
            } else {
                setReplied(await getReplied().edit(messageCreateOptions));
            }
        } else {
            if (messageCreateOptions instanceof MessageCore) {
                messageCreateOptions.buttonActions.forEach(array => array.forEach(action => action.register()));
                /** @type {void | Message} */
                const sent = await this.interaction.editReply({ ...messageCreateOptions.getMessage(), fetchReply: options.fetchReply || messageCreateOptions.emojiActions.length !== 0 });
                if (sent) {
                    setReplied(sent);
                    messageCreateOptions.apply(sent);
                }
            } else if (messageCreateOptions instanceof MessagePages) {
                /** @type {Message} */
                const sent = await messageCreateOptions.interactionReply(this.interaction, { edit: true });
                setReplied(sent);
            } else {
                const message = await this.interaction.editReply({ ...messageCreateOptions, fetchReply: options.fetchReply });
                if (options.fetchReply) {
                    setReplied(message);
                }
            }
        }
        setRepliedData(messageCreateOptions);
        return getReplied();
    }

    /**
     * @param {object} [options={}]
     * @param {boolean} [options.showError=false] Whether to show the error stack trace while deleting the reply
     * @returns {Promise<boolean>} Whether the reply message deleted successfully
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
     * @param {import("discord.js").MessageCreateOptions | MessageCore | MessagePages} message
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
            const sendFunction = async (messageCreateOptions) => {
                return await (options.reply ? this.msg.reply(messageCreateOptions) : this.msg.channel.send(messageCreateOptions));
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