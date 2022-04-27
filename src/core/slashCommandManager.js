const { ApplicationCommandManager, ChatInputApplicationCommandData, ApplicationCommand } = require("discord.js");
const Command = require("../command/Command");
const Core = require("./Core");

/** 
 * @param {Command[]} commands
 * @param {Core} core
 */
async function applySlashCommands(core) {
    const commands = core.commands.filter(c => c.type === "SLASH_COMMAND" || c.type === "BOTH");

    /** @type {ApplicationCommandManager} */
    const applicationCommandManager = core.options.guildId
        ? await core.client.guilds.fetch(core.options.guildId).then(g => g.commands)
        : core.client.application.commands;
    const oldCommands = await applicationCommandManager.fetch().then(c => [...c.values()]);
    const newCommands = commands.map(c => {
        return {
            name: c.name,
            description: c.description,
            type: "CHAT_INPUT",
            options: c.options,
            // defaultPermission: c.defaultPermission,
        }
    });
    await apply(applicationCommandManager, oldCommands, newCommands);
}

/** 
 * @private 
 * @param {ApplicationCommandManager} applicationCommandManager
 * @param {ApplicationCommand[]} oldCommands
 * @param {ChatInputApplicationCommandData[]} newCommands
 */
async function apply(applicationCommandManager, oldCommands, newCommands) {
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
 * @param {ChatInputApplicationCommandData} newCommand
 * @param {ApplicationCommand} oldCommand
 */
function isSameCommand(newCommand, oldCommand) {
    return oldCommand.equals(newCommand);
}

module.exports = {
    applySlashCommands: applySlashCommands
}