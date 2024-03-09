// @ts-check

const { Core, Command, CustomEmoji, SelectMenuAction } = require("..");
const { ApplicationCommandOptionType, Partials, ComponentType, RoleSelectMenuBuilder } = require("discord.js");
require("dotenv").config();

const token = process.env.TOKEN;
if (!token) throw new Error("Invalid bot token");

const core = new Core(
    {
        intents: ["Guilds", "GuildMessages", "GuildMessageReactions", "MessageContent", "DirectMessages"],
        partials: [Partials.Channel], // this is required for MessageCommand in DMs
        allowedMentions: { repliedUser: false },
        token,
        prefix: "!",
        devMode: true,
        guildIds: ["736829048373903377"],
    }
);

const emojis = [];

core.addCommandsInDir("commands");

const command = new Command({
    name: "mention",
    description: "Mentions a user",
    messageCommandAliases: ["m"], // aliases for MessageCommand
    args: {
        "target": {
            type: ApplicationCommandOptionType.User,
            description: "The user to mention",
            required: true,
            messageCommand: true, // if this option is also for MessageCommand, set this to true; otherwise, set this to false
        },
    },
    supportsMessageCommand: true,
    supportsSlashCommand: true,
    supportsContextMenu: true,
    supportedContextMenus: ["USER"],
    run: async (ic, args) => {
        const selectMenu = new SelectMenuAction({
            core: core,
            customId: "roleSelect",
            type: ComponentType.RoleSelect,
            selectMenu: new RoleSelectMenuBuilder().setMinValues(1).setMaxValues(1).setPlaceholder("Select a role"),
            run: async (interaction, data) => {
                await interaction.reply({ content: `You selected ${interaction.roles.first()?.name}! "${data}", ${interaction.customId}` });
            },
        }).register();

        await ic.reply({
            content: `Hello ${args?.target?.displayName}!`,
            actions: [
                selectMenu.getComponent({
                    "id": 100005,
                    "abilityName": "Activity_Rogue_ElementReactionAttack_Melt",
                    "paramNameList": [
                        "Explode_CJB_CD",
                        "CJB_Damage"
                    ],
                }),
            ],
        });
    },
});


core.login((core) => {
    emojis.push(new CustomEmoji(core, "951644270312427570"));
});

core.addCommands(command);

core.client.on("ready", () => {
    core.applyCommands();
    emojis.forEach(emoji => emoji.resolve()); // or just use CustomEmoji.resolve() on send
});