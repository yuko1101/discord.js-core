import { APIInteractionDataResolvedGuildMember, APIRole, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Attachment, CommandInteractionOption, CommandInteractionOptionResolver, GuildBasedChannel, GuildMember, Message, Role, User } from "discord.js";
import Core from "./Core";
import { devModeCommandPrefix } from "./commandManager";
import { ApplicationCommandAutoCompleterContainer, ApplicationCommandOptionsContainer, ApplicationCommandValueContainer, CoreCommandOptionData, isApplicationCommandOptionsContainer } from "../command/Command";
import InteractionCore from "../command/InteractionCore";
import SelectMenuAction from "../action/SelectMenuAction";

export default {
    /**
     * @param core
     */
    init: (core: Core<true>) => {
        // handle message command
        async function runMessageCommand(msg: Message) {
            if (!msg.content) return;
            if (!core.options.prefix || !msg.content.startsWith(core.options.prefix)) return;

            const [commandNameInput, ...args] = msg.content.slice(core.options.prefix.length).split(/(?:"([^"]+)"|([^ ]+)) ?/).filter(e => e);
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName || c.messageCommandAliases.map(a => a.toLowerCase()).includes(commandName));
            if (!command) return;
            if (command.supports.includes("MESSAGE_COMMAND")) {
                await command.run(new InteractionCore(msg), stringsToArgs(args, command.args), core);
            }
        }

        core.client.on("messageCreate", async (msg) => {
            await runMessageCommand(msg);
        });
        core.client.on("messageUpdate", async (_, newMsg) => {
            // if newMsg is Message<boolean>
            if (newMsg["system"]) {
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
            if (command.supports.includes("SLASH_COMMAND")) {
                const args = optionsToArgs(interaction.options, [...(interaction.options?.data ?? [])]);

                await command.run(new InteractionCore(interaction), args, core);

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
            if (command.supports.includes("USER_CONTEXT_MENU") || command.supports.includes("MESSAGE_CONTEXT_MENU")) {
                await command.run(new InteractionCore(interaction), { [interaction.isUserContextMenuCommand() ? "user" : "message"]: interaction.targetId }, core);
            }
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
            const buttonAction = core.buttonActions.find(action => interaction.customId === action.customId);
            if (!buttonAction) return;
            await buttonAction.run(interaction);
        });


        // handle select menu actions
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isAnySelectMenu()) return;
            const selectMenuAction = core.selectMenuActions.find(action => interaction.customId === action.customId);
            if (!selectMenuAction) return;
            await (selectMenuAction as SelectMenuAction<typeof interaction>).run(interaction);
        });


        // handle autocompleters
        core.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isAutocomplete()) return;

            const commandNameInput = interaction.commandName.toLowerCase();
            const commandName = core.options.devMode ? commandNameInput.slice(devModeCommandPrefix.length) : commandNameInput;

            const command = core.commands.find(c => c.name.toLowerCase() === commandName);
            if (!command) return;
            if (!command.supports.includes("SLASH_COMMAND")) return;
            if (!interaction.options?.data) return;
            const options = getAllAutoCompleteOptions(autoCompleteOptionsToObject([...interaction.options.data]));
            const focused = options.find(option => option.option.focused);
            if (!focused) return;
            const focusedInAutocompleteInteraction = getOptionWithPath(command.args, focused.path);
            if (!focusedInAutocompleteInteraction) return;
            const autoCompleter = (focusedInAutocompleteInteraction as CoreCommandOptionData<ApplicationCommandAutoCompleterContainer>).autoCompleter;
            await autoCompleter(interaction, (focused.option.value ?? null) as string | number | null);
        });
    },
};

export type SimpleObject<T> = { [key: string]: T | _SimpleObject<T> };
type _SimpleObject<T> = SimpleObject<T>;

// TODO: convert string into appropriate class instance
/**
 * @param args
 * @param commandOptions
 */
function stringsToArgs(args: string[], commandOptions: CoreCommandOptionData[]): SimpleObject<string | undefined> {
    commandOptions = commandOptions.filter(option => option.messageCommand);

    const argObj: SimpleObject<string | undefined> = {};
    if (commandOptions.length === 0) return argObj;

    // if 1 command option is options-container, then all are options-container.
    // So, only check the first command option.
    const isDeep = isApplicationCommandOptionsContainer(commandOptions[0]);
    if (isDeep) {
        const selectedSubCommand = commandOptions.find(option => option.name === args[0]) as CoreCommandOptionData<ApplicationCommandSubGroupData> | CoreCommandOptionData<ApplicationCommandSubCommandData>;
        if (!selectedSubCommand) return argObj;
        argObj[selectedSubCommand.name] = stringsToArgs(args.slice(1), selectedSubCommand.options ?? []);
    } else {
        for (let i = 0; i < commandOptions.length; i++) {
            const commandOption = commandOptions[i];
            argObj[commandOption.name] = args[i] as string | undefined;
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

// TODO: simplify the type by removing APIInteractionDataResolvedGuildMember if possible.
/** @typedef */
export type CommandOptionValue = string | number | boolean | User | APIInteractionDataResolvedGuildMember | GuildBasedChannel | Role | APIRole | GuildMember | Attachment | null;

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
            return commandOptionResolver.getMember(commandOption.name) ?? commandOptionResolver.getUser(commandOption.name);
        case ApplicationCommandOptionType.Role:
            return commandOptionResolver.getRole(commandOption.name);
        case ApplicationCommandOptionType.Mentionable:
            return commandOptionResolver.getMember(commandOption.name) ?? commandOptionResolver.getUser(commandOption.name) ?? commandOptionResolver.getRole(commandOption.name);
        case ApplicationCommandOptionType.Attachment:
            return commandOptionResolver.getAttachment(commandOption.name);
        case ApplicationCommandOptionType.Subcommand:
        case ApplicationCommandOptionType.SubcommandGroup:
            throw new Error("Option-container cannot have a value");
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
 * @param options
 * @param path
 */
function getOptionWithPath(options: CoreCommandOptionData[], path: string[]): CoreCommandOptionData<ApplicationCommandValueContainer> | null {
    if (!options) return null;
    if (path.length === 0) return null;
    const option = options.find(o => o.name == path[0]);
    if (!option) return null;
    if ((option as CoreCommandOptionData<ApplicationCommandOptionsContainer>).options) {
        // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
        return getOptionWithPath((option as CoreCommandOptionData<ApplicationCommandOptionsContainer>).options ?? [], path.slice(1));
    } else {
        return option as CoreCommandOptionData<ApplicationCommandValueContainer>;
    }
}