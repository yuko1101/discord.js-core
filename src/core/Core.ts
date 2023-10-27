import { Client, ClientOptions, Snowflake } from "discord.js";
import EmojiAction from "../action/EmojiAction";
import ButtonAction from "../action/ButtonAction";
import { AnySelectMenuAction } from "../action/SelectMenuAction";
import fs from "fs";
import Command from "../command/Command";
import { applyCommands } from "./commandManager";
import handler from "./handler";

/** @typedef */
export interface CoreOptions extends ClientOptions {
    readonly devMode: boolean;
    readonly devGuildId?: Snowflake;
    readonly token: string;
    readonly prefix?: string;
    readonly guildIds: Snowflake[];
}

export default class Core<IsReady extends boolean = boolean> {
    /**  */
    readonly client: Client<IsReady>;
    /**  */
    readonly options: CoreOptions;

    /**  */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly commands: Command<any, any>[];
    /**  */
    readonly emojiActions: EmojiAction[];
    /**  */
    readonly buttonActions: ButtonAction[];
    /**  */
    readonly selectMenuActions: AnySelectMenuAction[];

    /**
     * @param client
     * @param options
     */
    constructor(options: CoreOptions) {
        this.client = new Client(options);
        this.options = options;

        if (this.options.devMode && (!this.options.devGuildId && this.options.guildIds.length === 0)) {
            throw Error("You should not use debug mode for global. Global application commands take too much time to apply their updates.");
        }

        this.commands = [];
        this.emojiActions = [];
        this.buttonActions = [];
        this.selectMenuActions = [];

        this.waitReady().then(core => handler.init(core));
    }


    public get guildIds(): Snowflake[] {
        return this.options.devMode && this.options.devGuildId ? [this.options.devGuildId] : this.options.guildIds ?? [];
    }

    async waitReady(): Promise<Core<true>> {
        if (this.isReady()) return this;
        await new Promise(resolve => {
            this.client.once("ready", resolve);
        });
        return this as Core<true>;
    }

    /**  */
    isReady(): this is Core<true> {
        return this.client.isReady();
    }

    /**
     * @param callback
    */
    async login(callback?: (client: Client<true>) => void) {
        this.client.login(this.options.token);
        const core = await this.waitReady();
        console.log(`Logged in as ${(core.client).user.tag}!`);
        if (callback) callback(core.client);
    }

    /**
     * @param commands
     */
    // TODO: not to use any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addCommands(...commands: Command<any, any>[]) {
        this.commands.push(...commands);
    }

    /**
     * @param dir
     * @param recursive
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async addCommandsInDir(dir: string, recursive = true): Promise<Command<any, any>[]> {
        const cwd = process.argv[1].replace(/\\/g, "/").replace(/\/[^/]+\.[^/]+$/, "");
        const files = fs.readdirSync(`${cwd}/${dir}`);
        const commands = [];
        for (const file of files) {
            const loadedFile = fs.lstatSync(`${cwd}/${dir}/${file}`);
            if (loadedFile.isDirectory()) {
                if (!recursive) continue;
                this.addCommandsInDir(`${dir}/${file}`, true);
            } else {
                const command = (await import(`file:///${cwd}/${dir}/${file}`)).default;
                if (!(command instanceof Command)) {
                    if (this.options.devMode) console.log(`Skipped importing ./${dir}/${file} because it is not a command file.`);
                    continue;
                }
                commands.push(command);
            }
        }
        this.addCommands(...commands);
        return commands;
    }

    /** @param name */
    removeCommand(name: string) {
        const index = this.commands.findIndex(c => c.name === name);
        if (index === -1) return;
        this.commands.splice(index, 1);
    }

    async applyCommands() {
        const core = await this.waitReady();
        if (this.guildIds.length === 0) {
            // apply for global
            await applyCommands(core, null);
        } else {
            // apply for specified guilds
            for (const guildId of core.guildIds) {
                await applyCommands(core, guildId);
            }
        }
    }
}