import { APIRole, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Attachment, CommandInteractionOption, CommandInteractionOptionResolver, Guild, GuildBasedChannel, Message, Role, User } from "discord.js";
import Core from "./Core";
import { devModeCommandPrefix } from "./commandManager";
import { ApplicationCommandAutoCompleterContainer, ApplicationCommandValueContainer, ConvertArgsType, CoreCommandArgs, CoreCommandOptionData, isApplicationCommandOptionsContainer } from "../command/Command";
import InteractionCore from "../command/InteractionCore";
import { actionDataSeparator, decompressString, decompressStringWithGzip } from "../action/Action";
import { JsonElement } from "config_file.js";

export default {
    /**
     * @param core
     */
    init: (core: Core<true>) => {
        // handle message command
        async function runMessageCommand(msg: Message) {
            if (!msg.content) return;
            if (!core.options.prefix || !msg.content.startsWith(core.options.prefix)) return;

            const [commandNameInput, args] = parseMessageCommand(msg.content.slice(core.options.prefix.length));
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName || c.messageCommandAliases.map(a => a.toLowerCase()).includes(commandName));
            if (!command) return;
            if (command.supportsMessageCommand) {
                await command.run(new InteractionCore(msg), stringsToArgs(core, msg.guild, args, command.args as CoreCommandArgs<true>) as ConvertArgsType<true, Extract<typeof command.args, CoreCommandArgs<true>>>, core);
            }
        }

        core.client.on("messageCreate", async (msg) => {
            await runMessageCommand(msg);
        });
        core.client.on("messageUpdate", async (_, newMsg) => {
            // if newMsg is Message<boolean>
            if (newMsg["system"] !== null) {
                await runMessageCommand(newMsg);
            } else {
                // TODO: support PartialMessage
                console.warn("Ignored message editing", newMsg);
            }
        });

        // handle slash command
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (core.options.devMode) {
                console.log(`Took ${Date.now() - interaction.createdTimestamp}ms to catch the interaction`);
                console.time(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
            }
            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) {
                if (core.options.devMode) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("No commands matched");
                }
                return;
            }
            if (command.supportsSlashCommand) {
                const args = optionsToArgs(interaction.options, [...(interaction.options?.data ?? [])]);

                await command.run(new InteractionCore(interaction), args as ConvertArgsType<false, Extract<typeof command.args, CoreCommandArgs<false>>>, core);

                if (core.options.devMode) {
                    console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                    console.log("Slash command complete");
                }
            } else if (core.options.devMode) {
                console.timeEnd(`SLASH_COMMAND:${interaction.commandName}:${interaction.id}`);
                console.log("Command does not support slash command");
            }
        });

        // handle context menu
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isContextMenuCommand()) return;
            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;

            const supported = command.supportsContextMenu && command.supportedContextMenus.some(s => s === (interaction.isUserContextMenuCommand() ? "USER" : "MESSAGE"));
            if (!supported) return;

            await command.run(new InteractionCore(interaction), {}, core);
        });

        // handle emoji actions
        core.client.on("messageReactionAdd", (messageReaction, user) => {
            if (user.id === core.client.user.id) return;
            core.emojiActions
                .filter(action => messageReaction.emoji.name === action.emoji)
                .filter(action => action.appliedMessages.includes(messageReaction.message.id))
                .forEach(action => action.run(messageReaction, user, true));
        });

        core.client.on("messageReactionRemove", (messageReaction, user) => {
            if (user.id === core.client.user.id) return;
            core.emojiActions
                .filter(action => messageReaction.emoji.name === action.emoji)
                .filter(action => action.appliedMessages.includes(messageReaction.message.id))
                .forEach(action => action.run(messageReaction, user, false));
        });

        // handle button actions
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton()) return;

            const actionDataSeparatorIndex = interaction.customId.indexOf(actionDataSeparator);
            const customId = actionDataSeparatorIndex !== -1 ? interaction.customId.slice(0, actionDataSeparatorIndex) : interaction.customId;

            const buttonAction = core.buttonActions.find(action => action.customId === customId);
            if (!buttonAction) return;

            const data = actionDataSeparatorIndex !== -1 ? decompressJson(interaction.customId.slice(actionDataSeparatorIndex + 1)) : undefined;
            await buttonAction.run(interaction, data);
        });


        // handle select menu actions
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isAnySelectMenu()) return;

            const actionDataSeparatorIndex = interaction.customId.indexOf(actionDataSeparator);
            const customId = actionDataSeparatorIndex !== -1 ? interaction.customId.slice(0, actionDataSeparatorIndex) : interaction.customId;

            const selectMenuAction = core.selectMenuActions.find(action => action.customId === customId);
            if (!selectMenuAction) return;

            const data = actionDataSeparatorIndex !== -1 ? decompressJson(interaction.customId.slice(actionDataSeparatorIndex + 1)) : undefined;
            await selectMenuAction.run(interaction, data);
        });


        // handle autocompleters
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isAutocomplete()) return;

            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (!command.supportsSlashCommand) return;
            if (!interaction.options?.data) return;
            const options = getAllAutoCompleteOptions(autoCompleteOptionsToObject([...interaction.options.data]));
            const focused = options.find(option => option.option.focused);
            if (!focused) return;
            const focusedInAutocompleteInteraction = getOptionWithPath(command.args, focused.path);
            if (!focusedInAutocompleteInteraction) return;
            const autoCompleter = (focusedInAutocompleteInteraction as CoreCommandOptionData<boolean, ApplicationCommandAutoCompleterContainer>).autoCompleter;
            await autoCompleter(interaction, (focused.option.value ?? null) as string | number | null);
        });
    },
};

export type SimpleObject<T> = { [key: string]: T | _SimpleObject<T> };
type _SimpleObject<T> = SimpleObject<T>;

/** @param str */
function parseMessageCommand(str: string): [string, string[]] {
    str = str.trim();
    const commandName = str.trim().split(" ")[0];
    const argsString = str.slice(commandName.length).trim();

    const args: string[] = [];
    let isInQuote = false;
    let isEscaped = false;
    let currentArgText = "";
    for (let i = 0; i < argsString.length; i++) {
        if (argsString[i] === "\"" && !isEscaped) {
            isInQuote = !isInQuote;
            continue;
        }
        if (argsString[i] === "\\" && !isEscaped) {
            isEscaped = true;
            currentArgText += argsString[i];
            continue;
        }
        if (argsString[i] === " " && !isInQuote) {
            if (currentArgText === "") continue;
            args.push(currentArgText);
            currentArgText = "";
            continue;
        }
        if (argsString[i] === "\"" && isEscaped) {
            currentArgText = currentArgText.slice(0, -1);
        }
        currentArgText += argsString[i];
        isEscaped = false;
        if (i === argsString.length - 1) {
            args.push(currentArgText);
        }
    }

    return [commandName, args];
}

/**
 * @param messageArgs
 * @param commandOptions
 */
function stringsToArgs(core: Core<true>, guild: Guild | null, messageArgs: string[], coreCommandArgs: CoreCommandArgs<true>): SimpleObject<CommandOptionValue | undefined> {
    const coreArgsEntries = Object.entries(coreCommandArgs).filter(([, value]) => value.messageCommand);

    const argObj: SimpleObject<CommandOptionValue | undefined> = {};
    if (coreArgsEntries.length === 0) return {};

    // if 1 command option is options-container, then all are options-container.
    // So, only check the first command option.
    const isDeep = isApplicationCommandOptionsContainer(coreArgsEntries[0][1]);
    if (isDeep) {
        const selectedSubCommand = (coreArgsEntries as [string, CoreCommandOptionData<true, ApplicationCommandSubGroupData> | CoreCommandOptionData<true, ApplicationCommandSubCommandData>][])
            .find(arg => arg[0] === messageArgs[0] || arg[1].messageAliases?.includes(messageArgs[0]));
        if (!selectedSubCommand) return {};
        argObj[selectedSubCommand[0]] = stringsToArgs(core, guild, messageArgs.slice(1), selectedSubCommand[1].options ?? {});
    } else {
        for (let i = 0; i < coreArgsEntries.length; i++) {
            const messageArg = messageArgs[i];
            const coreCommandArg = coreArgsEntries[i];
            argObj[coreCommandArg[0]] = messageArg !== undefined ? getCommandOptionValueFromString(core, guild, coreCommandArg[1], messageArg) : undefined;
        }
    }

    return argObj;
}

/**
 * @param options
 */
function optionsToArgs(commandOptionResolver: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">, options: CommandInteractionOption[]): SimpleObject<CommandOptionValue> {
    if (!options) return {};
    const obj: SimpleObject<CommandOptionValue> = {};
    for (const option of options) {
        if (option.options) {
            // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
            obj[option.name] = optionsToArgs(commandOptionResolver, option.options);
        } else {
            obj[option.name] = getCommandOptionValue(commandOptionResolver, option);
        }
    }
    return obj;
}

// TODO: simplify the type by removing APIRole if possible.
/** @typedef */
export type CommandOptionValue = string | number | boolean | User | GuildBasedChannel | Role | APIRole | Attachment | null;

/**
 * @param commandOption
 */
function getCommandOptionValue(commandOptionResolver: Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">, commandOption: CommandInteractionOption): CommandOptionValue {
    switch (commandOption.type) {
        case ApplicationCommandOptionType.String:
            return commandOptionResolver.getString(commandOption.name);
        case ApplicationCommandOptionType.Number:
            return commandOptionResolver.getNumber(commandOption.name);
        case ApplicationCommandOptionType.Integer:
            return commandOptionResolver.getInteger(commandOption.name);
        case ApplicationCommandOptionType.Boolean:
            return commandOptionResolver.getBoolean(commandOption.name);
        case ApplicationCommandOptionType.Channel:
            return commandOptionResolver.getChannel(commandOption.name);
        case ApplicationCommandOptionType.User:
            return commandOptionResolver.getUser(commandOption.name);
        case ApplicationCommandOptionType.Role:
            return commandOptionResolver.getRole(commandOption.name);
        case ApplicationCommandOptionType.Mentionable:
            return commandOptionResolver.getUser(commandOption.name) ?? commandOptionResolver.getRole(commandOption.name);
        case ApplicationCommandOptionType.Attachment:
            return commandOptionResolver.getAttachment(commandOption.name);
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
            throw new Error("Option-container cannot have a value");
    }
}

/**
 * @param commandOption
 * @param str
 */
function getCommandOptionValueFromString(core: Core<true>, guild: Guild | null, commandOption: CoreCommandOptionData, str: string): CommandOptionValue {
    switch (commandOption.type) {
        case ApplicationCommandOptionType.String:
            return str;
        case ApplicationCommandOptionType.Number:
            return Number(str);
        case ApplicationCommandOptionType.Integer:
            return parseInt(str);
        case ApplicationCommandOptionType.Boolean:
            return str === "true";
        case ApplicationCommandOptionType.User: {
            const id = str.startsWith("<@") ? str.slice(2, -1) : str;
            return core.client.users.resolve(id);
        }
        case ApplicationCommandOptionType.Channel: {
            const id = str.startsWith("<#") ? str.slice(2, -1) : str;
            const channel = core.client.channels.resolve(id);
            if (!channel) return null;
            if (channel.isDMBased()) throw new Error("Cannot use DM-based channel ");
            return channel;
        }
        case ApplicationCommandOptionType.Role: {
            if (guild === null) return null;
            const id = str.startsWith("<@&") ? str.slice(3, -1) : str;
            return guild.roles.resolve(id);
        }
        case ApplicationCommandOptionType.Mentionable:
            if (guild === null) return null;
            if (str.startsWith("<@&")) {
                return guild.roles.resolve(str.slice(3, -1));
            } else if (str.startsWith("<@")) {
                return core.client.users.resolve(str.slice(2, -1));
            } else {
                return guild.client.users.resolve(str) ?? guild.roles.resolve(str);
            }
        case ApplicationCommandOptionType.Attachment:
            // TODO: get attachment from message
            return str;
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
            return str;
    }
}

/**
 * @param options
 * @param path
 */
function getAllAutoCompleteOptions(options: SimpleObject<CommandInteractionOption>, path: string[] = []): { path: string[], option: CommandInteractionOption }[] {
    const result: { path: string[], option: CommandInteractionOption }[] = [];
    for (const key of Object.keys(options)) {
        // options[key]がCommandInteractionOptionでなかったら(SimpleObject<CommandInteractionOptions>だったら)
        if (typeof options[key] === "object" && options[key] !== null && options[key] !== undefined && !options[key].name) {
            result.push(...getAllAutoCompleteOptions(options[key] as SimpleObject<CommandInteractionOption>, [...path, key]));
        } else {
            result.push({ path: [...path, key], option: options[key] as CommandInteractionOption });
        }
    }
    return result;
}

/**
 * @param options
 */
function autoCompleteOptionsToObject(options: CommandInteractionOption[]): SimpleObject<CommandInteractionOption> {
    if (!options) return {};
    const obj: SimpleObject<CommandInteractionOption> = {};
    for (const option of options) {
        if (option.options) {
            // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
            obj[option.name] = autoCompleteOptionsToObject(option.options);
        } else {
            obj[option.name] = option;
        }
    }
    return obj;
}


/**
 * @param args
 * @param path
 */
function getOptionWithPath<SupportsMessageCommand extends boolean>(args: CoreCommandArgs<SupportsMessageCommand>, path: string[]): CoreCommandOptionData<SupportsMessageCommand, ApplicationCommandValueContainer> | null {
    if (!args) return null;
    if (path.length === 0) return null;
    const option = args[path[0]];
    if (!option) return null;
    if (option.type === ApplicationCommandOptionType.Subcommand || option.type === ApplicationCommandOptionType.SubcommandGroup) {
        // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
        return getOptionWithPath(option.options ?? {}, path.slice(1)) as CoreCommandOptionData<SupportsMessageCommand, ApplicationCommandValueContainer>;
    } else {
        return option as CoreCommandOptionData<SupportsMessageCommand, ApplicationCommandValueContainer>;
    }
}

function decompressJson(compressed: string): JsonElement {
    const type = compressed[0];
    const data = compressed.slice(1);
    switch (type) {
        case "r":
            return JSON.parse(data);
        case "c":
            return JSON.parse(decompressString(data));
        case "g":
            return JSON.parse(decompressStringWithGzip(data));
        default:
            throw new Error(`Invalid compression type: ${type}`);
    }
}