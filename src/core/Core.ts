import { Client, Snowflake } from "discord.js";
import EmojiAction from "../action/EmojiAction";
import ButtonAction from "../action/ButtonAction";
import SelectMenuAction from "../action/SelectMenuAction";
import fs from "fs";
import Command from "../command/Command";
import { applyCommands } from "./commandManager";
import handler from "./handler";

/** @typedef */
export interface CoreOptions {
    readonly devMode: boolean;
    readonly devGuildId?: Snowflake;
    readonly token: string;
    readonly prefix?: string;
    readonly guildId?: Snowflake;
}

export default class Core<IsReady extends boolean = false> {
    /**  */
    readonly client: Client<IsReady>;
    /**  */
    readonly options: CoreOptions;

    /**  */
    readonly commands: Command[];
    /**  */
    readonly emojiActions: EmojiAction[];
    /**  */
    readonly buttonActions: ButtonAction[];
    /**  */
    readonly selectMenuActions: SelectMenuAction[];

    /**
     * @param client
     * @param options
     */
    constructor(client: Client<boolean>, options: CoreOptions) {
        this.client = client;
        this.options = options;

        if (this.options.devMode && !this.options.devGuildId) {
            throw Error("You should not use debug mode for global. Global application commands take too much time to apply their updates.");
        }

        this.commands = [];
        this.emojiActions = [];
        this.buttonActions = [];
        this.selectMenuActions = [];

        this.waitReady().then(core => handler.init(core));
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
    async login(callback: (client: Client<true>) => void) {
        this.client.login(this.options.token);
        const core = await this.waitReady();
        console.log(`Logged in as ${(core.client).user.tag}!`);
        if (callback) callback(core.client);
    }

    /**
     * @param commands
     */
    addCommands(...commands: Command[]) {
        this.commands.push(...commands);
    }

    /**
     * @param dir
     * @param recursive
     */
    async addCommandsInDir(dir: string, recursive: true): Promise<Command[]> {
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
        await applyCommands(core);
    }
}