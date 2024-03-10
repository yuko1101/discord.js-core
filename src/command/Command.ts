import { APIRole, ApplicationCommandAutocompleteNumericOptionData, ApplicationCommandAutocompleteStringOptionData, ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Attachment, AutocompleteInteraction, Awaitable, GuildBasedChannel, Role, User } from "discord.js";
import { Overwrite } from "../utils/ts_utils";
import Core from "../core/Core";
import InteractionCore from "./InteractionCore";
import { SimpleBuilder } from "../utils/Builder";

/**
 * @typedef
 */
export type CoreCommandOptionData<IsMessageCommand extends boolean = boolean, T extends ApplicationCommandOptionData = ApplicationCommandOptionData> = IsMessageCommand extends true ? ApplicationCommandOptionDataWithAutoCompleter<IsMessageCommand, T> & { messageCommand: boolean } : ApplicationCommandOptionDataWithAutoCompleter<IsMessageCommand, T>;

/**
 * @typedef
 * Adds autoCompleter property to ApplicationCommandOptionData and messageAliases to ApplicationCommandOptionContainer recursively.
 */
export type ApplicationCommandOptionDataWithAutoCompleter<IsMessageCommand extends boolean, T extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    T extends ApplicationCommandSubGroupData
    ? Overwrite<Omit<T, "name">, { options?: CoreCommandArgs<IsMessageCommand, CoreCommandOptionData<IsMessageCommand, Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData>>> } & (IsMessageCommand extends true ? { messageAliases?: string[] } : object)>
    : T extends ApplicationCommandSubCommandData
    ? Overwrite<Omit<T, "name">, { options?: CoreCommandArgs<IsMessageCommand, CoreCommandOptionData<IsMessageCommand, Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>>> } & (IsMessageCommand extends true ? { messageAliases?: string[] } : object)>
    : T extends ApplicationCommandAutoCompleterContainer
    ? Omit<T, "name"> & { autoCompleter: (interaction: AutocompleteInteraction, value: string | number | null) => Promise<void> }
    : Omit<T, "name">;

/** @typedef */
export type ApplicationCommandOptionsContainer = ApplicationCommandSubGroupData | ApplicationCommandSubCommandData;
/** @typedef */
export type ApplicationCommandValueContainer = Exclude<ApplicationCommandOptionData, ApplicationCommandOptionsContainer>;
/** @typedef */
export type ApplicationCommandAutoCompleterContainer = ApplicationCommandAutocompleteStringOptionData | ApplicationCommandAutocompleteNumericOptionData;

// TODO: simplify the type by removing APIRole if possible.
/** @typedef */
export type GetValueType<T extends ApplicationCommandOptionType> =
    T extends ApplicationCommandOptionType.String ? string
    : T extends ApplicationCommandOptionType.Number ? number
    : T extends ApplicationCommandOptionType.Integer ? number // TODO: restrict to integer
    : T extends ApplicationCommandOptionType.Boolean ? boolean
    : T extends ApplicationCommandOptionType.User ? User
    : T extends ApplicationCommandOptionType.Channel ? GuildBasedChannel
    : T extends ApplicationCommandOptionType.Role ? Role | APIRole
    : T extends ApplicationCommandOptionType.Mentionable ? User | Role | APIRole
    : T extends ApplicationCommandOptionType.Attachment ? Attachment
    : never;

/** @typedef */
export type CoreCommandArgs<IsMessageCommand extends boolean, T extends CoreCommandOptionData<IsMessageCommand> = CoreCommandOptionData<IsMessageCommand>> = { [name: string]: T };

/** @typedef */
export type ConvertArgsType<IsMessageCommand extends boolean, T extends CoreCommandArgs<IsMessageCommand> | undefined> = T extends undefined ? undefined : {
    [K in keyof T]:
    T[K] extends CoreCommandOptionData<IsMessageCommand, ApplicationCommandOptionsContainer> ? ConvertArgsType<IsMessageCommand, Extract<T[K]["options"], CoreCommandArgs<IsMessageCommand>>>
    : T[K] extends CoreCommandOptionData<IsMessageCommand, ApplicationCommandValueContainer> ? IsMessageCommand extends true ? GetValueType<T[K]["type"]> | undefined : T[K]["required"] extends true ? GetValueType<T[K]["type"]> : GetValueType<T[K]["type"]> | undefined
    : never
};

/** @typedef */
export type Args<IsMessageCommand extends boolean, IsContextMenuCommand extends boolean, T extends CoreCommandArgs<IsMessageCommand> | undefined> = IsContextMenuCommand extends true ? ConvertArgsType<IsMessageCommand, T> | null : ConvertArgsType<IsMessageCommand, T>;

/** @typedef */
export interface CommandData<SupportsMessageCommand extends boolean, SupportsContextMenu extends boolean, ArgsData extends CoreCommandArgs<SupportsMessageCommand>> {
    readonly name: string;
    readonly description?: string;
    readonly messageCommandAliases?: string[];
    readonly args?: ArgsData;
    readonly supportsMessageCommand: SupportsMessageCommand;
    readonly supportsContextMenu: SupportsContextMenu;
    readonly supportedContextMenus?: SupportedContextMenus<SupportsContextMenu>;
    readonly supportsSlashCommand: boolean;
    readonly run: (ic: InteractionCore, args: Args<SupportsMessageCommand, SupportsContextMenu, ArgsData>, core: Core<true>) => Awaitable<unknown>;
}

export default class Command<SupportsMessageCommand extends boolean = boolean, SupportsContextMenu extends boolean = boolean, ArgsData extends CoreCommandArgs<SupportsMessageCommand> = CoreCommandArgs<SupportsMessageCommand>> extends SimpleBuilder {
    /**  */
    readonly data: CommandData<SupportsMessageCommand, SupportsContextMenu, ArgsData>;
    /**  */
    readonly name: string;
    /**  */
    readonly description: string | null;
    /**  */
    readonly messageCommandAliases: string[];
    /**  */
    readonly args: ArgsData;
    /**  */
    readonly supportsMessageCommand: SupportsMessageCommand;
    /**  */
    readonly supportsContextMenu: SupportsContextMenu;
    /**  */
    readonly supportedContextMenus: SupportedContextMenus<SupportsContextMenu>;
    /**  */
    readonly supportsSlashCommand: boolean;
    /**  */
    readonly run: (ic: InteractionCore, args: Args<SupportsMessageCommand, SupportsContextMenu, ArgsData>, core: Core<true>) => Awaitable<unknown>;

    /**
     * @param data
    */
    constructor(data: CommandData<SupportsMessageCommand, SupportsContextMenu, ArgsData>) {
        super();
        this.data = data;
        this.name = this.data.name;
        this.description = this.data.description ?? null;
        this.args = this.data.args ?? {} as ArgsData;
        this.messageCommandAliases = this.data.messageCommandAliases ?? [];
        this.supportsMessageCommand = this.data.supportsMessageCommand;
        this.supportsContextMenu = this.data.supportsContextMenu;
        this.supportedContextMenus = this.data.supportedContextMenus ?? ([] as SupportedContextMenus<SupportsContextMenu>);
        this.supportsSlashCommand = this.data.supportsSlashCommand;
        this.run = this.data.run;
    }
}


export type SupportedContextMenus<SupportsContextMenu extends boolean> = SupportsContextMenu extends true ? ["USER" | "MESSAGE"] | ["USER", "MESSAGE"] | ["MESSAGE", "USER"] : [];


export function isApplicationCommandOptionsContainer(commandOptionData?: ApplicationCommandOptionData | CoreCommandOptionData): commandOptionData is ApplicationCommandOptionsContainer {
    if (!commandOptionData) return false;
    return commandOptionData.type === ApplicationCommandOptionType.SubcommandGroup || commandOptionData.type === ApplicationCommandOptionType.Subcommand;
}