"use strict";
const InteractionCore = require("../command/InteractionCore");
const Core = require("./Core");
const { CommandInteractionOption } = require("discord.js");

module.exports = {
    /** @param {Core} core */
    init: (core) => {
        // handle message command
        core.client.on("messageCreate", async (msg) => {
            if (!msg.content.startsWith(core.options.prefix)) return;
            const [commandName, ...args] = msg.content.slice(core.options.prefix.length).split(/(?:"([^"]+)"|([^ ]+)) ?/).filter(e => e);

            const command = core.commands.find(c => c.name.toLowerCase() === commandName || c.aliases.map(a => a.toLowerCase()).includes(commandName));
            if (!command) return;
            if (command.supports.includes("MESSAGE_COMMAND")) {
                await command.run(new InteractionCore({ msg: msg }), argsToObject(args, command.args), core);
            }
        });

        // handle slash command
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;
            const commandName = interaction.commandName.toLowerCase();

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (command.supports.includes("SLASH_COMMAND")) {
                const args = optionsToObject(interaction.options?.data);

                await command.run(new InteractionCore({ interaction: interaction }), args, core);
            }
        });

        // handle context menu
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isContextMenu()) return;
            const commandName = interaction.commandName.toLowerCase();

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (command.supports.includes("USER_CONTEXT_MENU") || command.supports.includes("MESSAGE_CONTEXT_MENU")) {
                await command.run(new InteractionCore({ interaction: interaction }), { [interaction.targetType.toLowerCase()]: interaction.targetId }, core);
            }
        });

        // handle emoji actions
        core.client.on("messageReactionAdd", (messageReaction, user) => {
            if (user.id === core.client.user.id) return;
            core.emojiActions
                .filter(action => messageReaction.emoji.name === action.label)
                .filter(action => action.appliedMessages.includes(messageReaction.message.id))
                .forEach(action => action.run(messageReaction, user, true));
        });

        core.client.on("messageReactionRemove", (messageReaction, user) => {
            if (user.id === core.client.user.id) return;
            core.emojiActions
                .filter(action => messageReaction.emoji.name === action.label)
                .filter(action => action.appliedMessages.includes(messageReaction.message.id))
                .forEach(action => action.run(messageReaction, user, false));
        });

        // handle button actions
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;
            const buttonAction = core.buttonActions.find(action => interaction.customId === action.customId);
            if (!buttonAction) return;
            await buttonAction.run(interaction);
        });


        // handle select menu actions
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isSelectMenu()) return;
            const selectMenuAction = core.selectMenuActions.find(action => interaction.customId === action.customId);
            if (!selectMenuAction) return;
            await selectMenuAction.run(interaction);
        });
    }
}

/**
 * @private
 * @param {string[]} args
 * @param {string[]} msgArgsOption
 * @returns {object}
 */
function argsToObject(args, msgArgsOption) {
    const argObj = {}
    if (args.length <= msgArgsOption.length) {
        args.forEach((arg, i, _) => argObj[msgArgsOption[i]] = arg)
        return argObj
    } else if (args.length > msgArgsOption.length) {
        for (let i = 0; i < msgArgsOption.length; i++) {
            if (i === msgArgsOption.length - 1) {
                argObj[msgArgsOption[i]] = args.join(" ")
                break
            }
            argObj[msgArgsOption[i]] = args.shift()
        }
        return argObj
    }
    return argObj
}

/**
 * @private
 * @param {CommandInteractionOption[]} options 
 * @returns {object}
 */
function optionsToObject(options) {
    if (!options) return {}
    const obj = {}
    for (const option of options) {
        if (option.options) {
            // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
            obj[option.name] = optionsToObject(option.options || []) || {}
        } else {
            obj[option.name] = option.value
        }
    }
    return obj
}