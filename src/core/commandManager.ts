import { ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, ApplicationCommandType, GuildApplicationCommandManager } from "discord.js";
import Core from "./Core";
import Command, { CoreCommandArgs } from "../command/Command";

const commandTypeMap = {
    "SLASH_COMMAND": ApplicationCommandType.ChatInput,
    "USER_CONTEXT_MENU": ApplicationCommandType.User,
    "MESSAGE_CONTEXT_MENU": ApplicationCommandType.Message,
};

export const devModeCommandPrefix = "dev-";

/**
 * @param core
 */
export async function applyCommands(core: Core<true>, guildId: string | null) {
    const commands = core.commands.filter(c => c.supportsSlashCommand || c.supportsContextMenu);

    const applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager = guildId
        ? await core.client.guilds.fetch(guildId).then(g => g.commands)
        : core.client.application.commands;
    const oldCommands = await applicationCommandManager.fetch({}).then(commandCollection => commandCollection.filter(c => (!core.options.devMode && !c.name.startsWith(devModeCommandPrefix)) || (core.options.devMode && c.name.startsWith(devModeCommandPrefix))));
    const newCommands = commands.map(c => getSupportedCommandTypes(c).map(s => {
        return {
            name: core.options.devMode ? `${devModeCommandPrefix}${c.name}` : c.name,
            description: s.endsWith("_CONTEXT_MENU") ? "" : c.description,
            type: commandTypeMap[s as keyof typeof commandTypeMap],
            options: s.endsWith("_CONTEXT_MENU") ? [] : convertToDiscordJsArgs(c.args as CoreCommandArgs<boolean>),
            // defaultPermission: c.defaultPermission,
        };
    })) as unknown as ApplicationCommandData[];
    await apply(applicationCommandManager, [...oldCommands.values()], newCommands.flat());
}

/**
 * @param command
 */
function getSupportedCommandTypes(command: Command): (keyof typeof commandTypeMap)[] {
    const supported: (keyof typeof commandTypeMap)[] = [];
    if (command.supportsSlashCommand) supported.push("SLASH_COMMAND");
    if (command.supportsContextMenu) {
        if (command.supportedContextMenus.some(s => s === "USER")) supported.push("USER_CONTEXT_MENU");
        if (command.supportedContextMenus.some(s => s === "MESSAGE")) supported.push("MESSAGE_CONTEXT_MENU");
    }
    return supported;
}

/**
 * @param applicationCommandManager
 * @param oldCommands
 * @param newCommands
 */
async function apply(applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager, oldCommands: ApplicationCommand[], newCommands: ApplicationCommandData[]) {
    await applySlashCommands(applicationCommandManager, oldCommands.filter(c => c.type === commandTypeMap.SLASH_COMMAND), newCommands.filter(c => c.type === commandTypeMap.SLASH_COMMAND));
    await applyContextMenus("USER", applicationCommandManager, oldCommands.filter(c => c.type === commandTypeMap.USER_CONTEXT_MENU), newCommands.filter(c => c.type === commandTypeMap.USER_CONTEXT_MENU));
    await applyContextMenus("MESSAGE", applicationCommandManager, oldCommands.filter(c => c.type === commandTypeMap.MESSAGE_CONTEXT_MENU), newCommands.filter(c => c.type === commandTypeMap.MESSAGE_CONTEXT_MENU));
}

/**
 * @param applicationCommandManager
 * @param oldCommands
 * @param newCommands
 */
async function applySlashCommands(applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager, oldCommands: ApplicationCommand[], newCommands: ApplicationCommandData[]) {
    const oldNames = oldCommands.map(c => c.name);
    const newNames = newCommands.map(c => c.name);
    const toAdd = newCommands.filter(c => !oldNames.includes(c.name));
    const toRemove = oldCommands.filter(c => !newNames.includes(c.name));
    if (toAdd.length > 0) {
        for (const command of toAdd) {
            await applicationCommandManager.create(command);
        }
    }
    if (toRemove.length > 0) {
        for (const command of toRemove) {
            await applicationCommandManager.delete(command);
        }
    }
    const toUpdate = newCommands.filter(c => oldNames.includes(c.name)).filter(c => !isSameCommand(c, oldCommands.find(o => o.name === c.name) as ApplicationCommand));
    if (toUpdate.length > 0) {
        for (const command of toUpdate) {
            await applicationCommandManager.edit(oldCommands.find(o => o.name === command.name) as ApplicationCommand, command);
        }
    }
    console.log(`[Core - ${getApplicationCommandManagerLabel(applicationCommandManager)}] Applied ${toAdd.length} new commands, ${toRemove.length} removed commands, ${toUpdate.length} updated commands.`);
    // console.log(oldCommands, newCommands);
}

/**
 * @param type
 * @param applicationCommandManager
 * @param oldCommands
 * @param newCommands
 */
async function applyContextMenus(type: "USER" | "MESSAGE", applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager, oldCommands: ApplicationCommand[], newCommands: ApplicationCommandData[]) {
    const oldNames = oldCommands.map(c => c.name);
    const newNames = newCommands.map(c => c.name);
    const toAdd = newCommands.filter(c => !oldNames.includes(c.name));
    const toRemove = oldCommands.filter(c => !newNames.includes(c.name));
    if (toAdd.length > 0) {
        for (const command of toAdd) {
            await applicationCommandManager.create(command);
        }
    }
    if (toRemove.length > 0) {
        for (const command of toRemove) {
            await applicationCommandManager.delete(command);
        }
    }
    const toUpdate = newCommands.filter(c => oldNames.includes(c.name)).filter(c => !isSameCommand(c, oldCommands.find(o => o.name === c.name) as ApplicationCommand));
    if (toUpdate.length > 0) {
        for (const command of toUpdate) {
            await applicationCommandManager.edit(oldCommands.find(o => o.name === command.name) as ApplicationCommand, command);
        }
    }
    console.log(`[Core - ${getApplicationCommandManagerLabel(applicationCommandManager)}] Applied ${toAdd.length} new ${type.toLowerCase()} context menus, ${toRemove.length} removed ${type.toLowerCase()} context menus, ${toUpdate.length} updated ${type.toLowerCase()} context menus.`);
    // console.log(oldCommands, newCommands);
}

/**
 * @param newCommand
 * @param oldCommand
 */
function isSameCommand(newCommand: ApplicationCommandData, oldCommand: ApplicationCommand): boolean {
    return oldCommand.equals(newCommand);
}


/**
 * @param coreCommandArgs
 */
function convertToDiscordJsArgs<T extends ApplicationCommandOptionData = ApplicationCommandOptionData>(args: CoreCommandArgs<boolean>): T[] {
    const options: T[] = [];

    const entries = Object.entries(args);
    for (const entry of entries) {
        if ("options" in entry[1]) {
            options.push({
                ...entry[1],
                name: entry[0],
                options: entry[1].type === ApplicationCommandOptionType.Subcommand
                    ? convertToDiscordJsArgs<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>>(entry[1].options ?? {})
                    : convertToDiscordJsArgs<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData>>(entry[1].options ?? {}),
            } as unknown as T);
        } else {
            options.push({
                ...entry[1],
                name: entry[0],
            } as unknown as T);
        }
    }

    return options;
}


/**
 * @param applicationCommandManager
 */
function getApplicationCommandManagerLabel(applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager): string {
    return "guild" in applicationCommandManager ? applicationCommandManager.guild.id : "Global";
}