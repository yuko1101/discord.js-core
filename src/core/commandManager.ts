import { ApplicationCommand, ApplicationCommandData, ApplicationCommandManager, ApplicationCommandType, GuildApplicationCommandManager } from "discord.js";
import Core from "./Core";

const commandTypeMap = {
    "SLASH_COMMAND": ApplicationCommandType.ChatInput,
    "USER_CONTEXT_MENU": ApplicationCommandType.User,
    "MESSAGE_CONTEXT_MENU": ApplicationCommandType.Message,
};

export const devModeCommandPrefix = "dev-";

/**
 * @param core
 */
export async function applyCommands(core: Core<true>) {
    const commands = core.commands.filter(c => c.supports.includes("SLASH_COMMAND"));

    const applicationCommandManager: ApplicationCommandManager | GuildApplicationCommandManager = core.guildId
        ? await core.client.guilds.fetch(core.guildId).then(g => g.commands)
        : core.client.application.commands;
    const oldCommands = await applicationCommandManager.fetch({}).then(commandCollection => commandCollection.filter(c => (!core.options.devMode && !c.name.startsWith(devModeCommandPrefix)) || (core.options.devMode && c.name.startsWith(devModeCommandPrefix))));
    const newCommands = commands.map(c => c.supports.filter(s => Object.keys(commandTypeMap).includes(s)).map(s => {
        return {
            name: core.options.devMode ? `${devModeCommandPrefix}${c.name}` : c.name,
            description: s.endsWith("_CONTEXT_MENU") ? "" : c.description,
            type: commandTypeMap[s as keyof typeof commandTypeMap],
            options: s.endsWith("_CONTEXT_MENU") ? [] : c.args,
            // defaultPermission: c.defaultPermission,
        };
    })) as unknown as ApplicationCommandData[];
    await apply(applicationCommandManager, [...oldCommands.values()], newCommands.flat());
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
    console.log(`[DiscordCore] Applied ${toAdd.length} new commands, ${toRemove.length} removed commands, ${toUpdate.length} updated commands.`);
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
    console.log(`[DiscordCore] Applied ${toAdd.length} new ${type.toLowerCase()} context menus, ${toRemove.length} removed ${type.toLowerCase()} context menus, ${toUpdate.length} updated ${type.toLowerCase()} context menus.`);
    // console.log(oldCommands, newCommands);
}

/**
 * @param newCommand
 * @param oldCommand
 */
function isSameCommand(newCommand: ApplicationCommandData, oldCommand: ApplicationCommand): boolean {
    return oldCommand.equals(newCommand);
}