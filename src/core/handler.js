const InteractionCore = require("../command/InteractionCore");
const Core = require("./Core");
const { CommandInteractionOption, InteractionType } = require("discord.js");

module.exports = {
    /** @param {Core} core */
    init: (core) => {
        // handle message command
        core.client.on("messageCreate", async (msg) => {
            if (!msg.content.startsWith(core.options.prefix)) return;

            const [commandNameInput, ...args] = msg.content.slice(core.options.prefix.length).split(/(?:"([^"]+)"|([^ ]+)) ?/).filter(e => e);
            const commandName = core.options.debug ? commandNameInput.slice(0, -("-debug".length)) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName || c.aliases.map(a => a.toLowerCase()).includes(commandName));
            if (!command) return;
            if (command.supports.includes("MESSAGE_COMMAND")) {
                await command.run(new InteractionCore({ msg: msg }), argsToObject(args, command.args), core);
            }
        });

        // handle slash command
        core.client.on("interactionCreate", async (interaction) => {
            if (core.options.debug) {
                console.log(`Took ${Date.now() - interaction.createdTimestamp}ms to catch the interaction`);
                console.time(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
            }
            if (!interaction.isChatInputCommand()) {
                if (core.options.debug) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("Not a slash command");
                }
                return;
            }
            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.debug ? commandNameInput.slice(0, -("-debug".length)) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) {
                if (core.options.debug) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("No commands matched");
                }
                return;
            }
            if (command.supports.includes("SLASH_COMMAND")) {
                const args = optionsToObject(interaction.options?.data);

                await command.run(new InteractionCore({ interaction: interaction }), args, core);

                if (core.options.debug) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("Slash command complete");
                }
            } else {
                if (core.options.debug) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("Command does not support slash command");
                }
            }
        });

        // handle context menu
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isContextMenuCommand()) return;
            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.debug ? commandNameInput.slice(0, -("-debug".length)) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (command.supports.includes("USER_CONTEXT_MENU") || command.supports.includes("MESSAGE_CONTEXT_MENU")) {
                await command.run(new InteractionCore({ interaction: interaction }), { [interaction.isUserContextMenuCommand() ? "user" : "message"]: interaction.targetId }, core);
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
            if (!interaction.isAnySelectMenu()) return;
            const selectMenuAction = core.selectMenuActions.find(action => interaction.customId === action.customId);
            if (!selectMenuAction) return;
            await selectMenuAction.run(interaction);
        });


        // handle autocompleters
        core.client.on("interactionCreate", async (interaction) => {
            if (interaction.type !== InteractionType.ApplicationCommandAutocomplete) return;

            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.debug ? commandNameInput.slice(0, -("-debug".length)) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (!command.supports.includes("SLASH_COMMAND")) return;
            if (!interaction.options?.data) return;
            const options = getAllAutoCompleteOptions(interaction.options.data);
            const focused = options.find(option => option.option.focused);
            if (!focused) return;
            const autocompleter = getOptionWithPath(command.options, focused.path)?.autocompleter;
            if (!autocompleter) return;
            await autocompleter(interaction, focused.option.value);
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

/**
 * @private
 * @param {CommandInteractionOption[]} options 
 * @returns {{path: string[], option: CommandInteractionOption}[]}
 */
function getAllAutoCompleteOptions(options, path = []) {
    const allOptions = path.length === 0 ? autoCompleteOptionsToObject(options) : options;
    const result = [];
    for (const key of Object.keys(allOptions)) {
        if (typeof allOptions[key] === "object" && allOptions[key] !== null && allOptions[key] !== undefined && !allOptions[key].name) {
            result.push(...getAllAutoCompleteOptions(allOptions[key], [...path, key]));
        } else {
            result.push({ path: [...path, key], option: allOptions[key] });
        }
    }
    return result;
}


/**
 * @private
 * @param {CommandInteractionOption[]} options
 * @returns {object}
 */
function autoCompleteOptionsToObject(options) {
    if (!options) return {}
    const obj = {}
    for (const option of options) {
        if (option.options) {
            // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
            obj[option.name] = autoCompleteOptionsToObject(option.options || []) || {}
        } else {
            obj[option.name] = option
        }
    }
    return obj
}


/**
 * @private
 * @param {(ApplicationCommandOptionData & { autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void> })[]} options
 * @param {string[]} path
 * @returns {(ApplicationCommandOptionData & { autocompleter?: (interaction: AutocompleteInteraction, value: any) => Promise<void> }) | null}
 */
function getOptionWithPath(options, path) {
    if (!options) return null
    if (path.length === 0) return options
    const option = options.find(o => o.name == path[0]);
    if (!option) return null
    if (option.options) {
        // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
        return getOptionWithPath(option.options, path.slice(1))
    } else {
        return option
    }
}