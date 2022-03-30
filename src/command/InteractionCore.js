"use strict";

const { CommandInteraction, Message, TextBasedChannel, Guild, GuildMember, User, MessageOptions } = require("discord.js");
const { bindOptions } = require("../utils/utils");

module.exports = class InteractionCore {
    /**
     * @param {Message | null} data.msg
     * @param {CommandInteraction | null} data.interaction
     */
    constructor(data) {
        /** @type {Message | null} @readonly */
        this.msg = data.msg;
        /** @type {CommandInteraction | null} @readonly */
        this.interaction = data.interaction;
        /** @type {boolean} @readonly */
        this.isSlashCommand = !!data.interaction;


        /** @type {TextBasedChannel} @readonly */
        this.channel = this.isSlashCommand ? this.interaction.channel : this.msg.channel;
        /** @type {Guild} @readonly */
        this.guild = this.isSlashCommand ? this.interaction.guild : this.msg.guild;
        /** @type {GuildMember} @readonly */
        this.member = this.isSlashCommand ? this.interaction.member : this.msg.member;
        /** @type {User} @readonly */
        this.user = this.isSlashCommand ? this.interaction.user : this.msg.author;
    }

    /**
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (only for slash command)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (for message command, whether show the typing in the channel)
     */
    async deferReply(options) {
        options = bindOptions({ fetchReply: false, ephemeral: false }, options);
        if (!this.isSlashCommand) {
            return await this.msg.channel.sendTyping();
        }
        return await this.interaction.deferReply({ fetchReply: options.fetchReply, ephemeral: options.ephemeral });
    }


    /** 
     * @param {MessageOptions} messageOptions 
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (only for slash command)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (only for slash command)
     * @returns {Message}
     */
    async reply(messageOptions, options) {
        options = bindOptions({ fetchReply: true, ephemeral: false }, options);
        if (!this.isSlashCommand) {
            /** @private @type {Message} */
            this.sentMessage = await this.msg.reply(messageOptions);
            return this.sentMessage;
        }
        return await this.interaction.reply({ ...messageOptions, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
    }

    /** 
     * @param {MessageOptions} messageOptions
     * @param {object} options
     * @param {boolean} options.fetchReply Whether to fetch the reply (only for slash command)
     * @param {boolean} options.ephemeral Whether to send the message as ephemeral (only for slash command)
     * @param {boolean} options.reply Whether to reply to the previous message (only for message command)
     * @returns {Message}
     */
    async followUp(messageOptions, options) {
        options = bindOptions({ fetchReply: true, ephemeral: false, reply: true }, options);
        if (!this.isSlashCommand) {
            if (this.sentMessage) {
                return options.reply ? await this.sentMessage.reply(messageOptions) : await this.msg.channel.send(messageOptions);
            }

            /** @private @type {Message} */
            this.sentMessage = await this.msg.reply(messageOptions);
            return this.sentMessage;

        }
        return await this.interaction.followUp({ ...messageOptions, fetchReply: options.fetchReply, ephemeral: options.ephemeral });
    }

    // /**
    //  * 
    //  */
    // async edit

    // TODO: add editReply, deleteReply, sendPages, and more
}