import { CommandInteractionOption, Message } from "discord.js";
import Core from "./Core";
import { devModeCommandPrefix } from "./commandManager";
import { ApplicationCommandAutoCompleterContainer, ApplicationCommandOptionsContainer, ApplicationCommandValueContainer, CoreApplicationCommandOptionData } from "../command/Command";
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
                await command.run(new InteractionCore(msg), argsToObject(args, command.messageCommandArgs), core);
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
                const args = optionsToObject([...(interaction.options?.data ?? [])]);

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
            const focusedInAutocompleteInteraction = getOptionWithPath(command.slashCommandOptions, focused.path);
            if (!focusedInAutocompleteInteraction) return;
            const autoCompleter = (focusedInAutocompleteInteraction as CoreApplicationCommandOptionData<ApplicationCommandAutoCompleterContainer>).autoCompleter;
            await autoCompleter(interaction, (focused.option.value ?? null) as string | number | null);
        });
    },
};

export type SimpleObject<T> = { [key: string]: T | _SimpleObject<T> };
type _SimpleObject<T> = SimpleObject<T>;

/**
 * @param args
 * @param msgArgsOption
 */
function argsToObject(args: string[], msgArgsOption: string[]): SimpleObject<string> {
    const argObj: SimpleObject<string> = {};
    if (args.length <= msgArgsOption.length) {
        args.forEach((arg, i) => argObj[msgArgsOption[i]] = arg);
        return argObj;
    } else if (args.length > msgArgsOption.length) {
        for (let i = 0; i < msgArgsOption.length; i++) {
            if (i === msgArgsOption.length - 1) {
                argObj[msgArgsOption[i]] = args.join(" ");
                break;
            }
            argObj[msgArgsOption[i]] = args.shift() as string;
        }
        return argObj;
    }
    return argObj;
}

/**
 * @param options
 */
function optionsToObject(options: CommandInteractionOption[]): SimpleObject<string | number | boolean> {
    if (!options) return {};
    const obj: SimpleObject<string | number | boolean> = {};
    for (const option of options) {
        if (option.options) {
            // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
            obj[option.name] = optionsToObject(option.options);
        } else {
            obj[option.name] = option.value as string | number | boolean;
        }
    }
    return obj;
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
function getOptionWithPath(options: CoreApplicationCommandOptionData[], path: string[]): CoreApplicationCommandOptionData<ApplicationCommandValueContainer> | null {
    if (!options) return null;
    if (path.length === 0) return null;
    const option = options.find(o => o.name == path[0]);
    if (!option) return null;
    if ((option as CoreApplicationCommandOptionData<ApplicationCommandOptionsContainer>).options) {
        // check options recursively ("SUB_COMMAND" or "SUB_COMMAND_GROUP")
        return getOptionWithPath((option as CoreApplicationCommandOptionData<ApplicationCommandOptionsContainer>).options ?? [], path.slice(1));
    } else {
        return option as CoreApplicationCommandOptionData<ApplicationCommandValueContainer>;
    }
}