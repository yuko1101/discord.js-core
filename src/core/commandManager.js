const { ApplicationCommandManager, ApplicationCommandData, ApplicationCommand, ApplicationCommandType, ChatInputApplicationCommandData } = require("discord.js");
const Command = require("../command/Command");
const Core = require("./Core");

const CommandType = {
    "MESSAGE_COMMAND": "MESSAGE_COMMAND",
    "SLASH_COMMAND": ApplicationCommandType.ChatInput,
    "USER_CONTEXT_MENU": ApplicationCommandType.User,
    "MESSAGE_CONTEXT_MENU": ApplicationCommandType.Message,
}

/** 
 * @param {Command[]} commands
 * @param {Core} core
 */
async function applyCommands(core) {
    const commands = core.commands.filter(c => c.supports.includes("SLASH_COMMAND"));

    /** @type {ApplicationCommandManager} */
    const applicationCommandManager = core.options.guildId
        ? await core.client.guilds.fetch(core.options.guildId).then(g => g.commands)
        : core.client.application.commands;
    const oldCommands = await applicationCommandManager.fetch().then(c => [...c.values()].filter(c => (!core.options.debug && !c.name.endsWith("-debug")) || (core.options.debug && c.name.endsWith("-debug"))));
    const newCommands = commands.map(c => c.supports.filter(s => Object.keys(CommandType).includes(s)).map(s => {
        return {
            name: core.options.debug ? `${c.name}-debug` : c.name,
            description: s.endsWith("_CONTEXT_MENU") ? "" : c.description,
            type: CommandType[s],
            options: s.endsWith("_CONTEXT_MENU") ? [] : c.options,
            // defaultPermission: c.defaultPermission,
        }
    }));
    await apply(applicationCommandManager, oldCommands, newCommands.reduce((acc, c) => acc.concat(c), []));
}


/** 
 * @private 
 * @param {ApplicationCommandManager} applicationCommandManager
 * @param {ApplicationCommand[]} oldCommands
 * @param {ApplicationCommandData[]} newCommands
 */
async function apply(applicationCommandManager, oldCommands, newCommands) {
    await applySlashCommands(applicationCommandManager, oldCommands.filter(c => c.type === CommandType.SLASH_COMMAND), newCommands.filter(c => c.type === CommandType.SLASH_COMMAND));
    await applyContextMenus("USER", applicationCommandManager, oldCommands.filter(c => c.type === CommandType.USER_CONTEXT_MENU), newCommands.filter(c => c.type === CommandType.USER_CONTEXT_MENU));
    await applyContextMenus("MESSAGE", applicationCommandManager, oldCommands.filter(c => c.type === CommandType.MESSAGE_CONTEXT_MENU), newCommands.filter(c => c.type === CommandType.MESSAGE_CONTEXT_MENU));
}

/** 
 * @private 
 * @param {ApplicationCommandManager} applicationCommandManager
 * @param {ApplicationCommand[]} oldCommands
 * @param {ChatInputApplicationCommandData[]} newCommands
 */
async function applySlashCommands(applicationCommandManager, oldCommands, newCommands) {
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
    const toUpdate = newCommands.filter(c => oldNames.includes(c.name)).filter(c => !isSameCommand(c, oldCommands.find(o => o.name === c.name)));
    if (toUpdate.length > 0) {
        for (const command of toUpdate) {
            await applicationCommandManager.edit(oldCommands.find(o => o.name === command.name), command);
        }
    }
    console.log(`[DiscordCore] Applied ${toAdd.length} new commands, ${toRemove.length} removed commands, ${toUpdate.length} updated commands.`);
    // console.log(oldCommands, newCommands);
}

/** 
 * @private 
 * @param {string} type
 * @param {ApplicationCommandManager} applicationCommandManager
 * @param {ApplicationCommand[]} oldCommands
 * @param {ApplicationCommand[]} newCommands
 */
async function applyContextMenus(type, applicationCommandManager, oldCommands, newCommands) {
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
    const toUpdate = newCommands.filter(c => oldNames.includes(c.name)).filter(c => !isSameCommand(c, oldCommands.find(o => o.name === c.name)));
    if (toUpdate.length > 0) {
        for (const command of toUpdate) {
            await applicationCommandManager.edit(oldCommands.find(o => o.name === command.name), command);
        }
    }
    console.log(`[DiscordCore] Applied ${toAdd.length} new ${type.toLowerCase()} context menus, ${toRemove.length} removed ${type.toLowerCase()} context menus, ${toUpdate.length} updated ${type.toLowerCase()} context menus.`);
    // console.log(oldCommands, newCommands);
}

/** 
 * @private
 * @param {ApplicationCommandData} newCommand
 * @param {ApplicationCommand} oldCommand
 */
function isSameCommand(newCommand, oldCommand) {
    return oldCommand.equals(newCommand);
}

module.exports = {
    applyCommands
}