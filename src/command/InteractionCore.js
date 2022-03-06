"use strict";

const { CommandInteraction, Message, TextBasedChannel, Guild, GuildMember, User } = require("discord.js");

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
        this.author = this.isSlashCommand ? this.interaction.user : this.msg.author;
    }
}