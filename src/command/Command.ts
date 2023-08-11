import { APIInteractionDataResolvedGuildMember, APIRole, ApplicationCommandAutocompleteNumericOptionData, ApplicationCommandAutocompleteStringOptionData, ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Attachment, AutocompleteInteraction, Awaitable, GuildBasedChannel, GuildMember, Role, User } from "discord.js";
import { Overwrite } from "../utils/ts_utils";
import Core from "../core/Core";
import InteractionCore from "./InteractionCore";

/**
 * @typedef
 */
export type CoreCommandOptionData<T extends ApplicationCommandOptionData = ApplicationCommandOptionData> = ApplicationCommandOptionDataWithAutoCompleter<T> & { messageCommand: boolean };

/**
 * @typedef
 * Adds autoCompleter property to ApplicationCommandOptionData and messageAliases to ApplicationCommandOptionContainer recursively.
 */
export type ApplicationCommandOptionDataWithAutoCompleter<T extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    T extends ApplicationCommandSubGroupData
    ? Overwrite<Omit<T, "name">, { options?: CoreCommandArgs<CoreCommandOptionData<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData>>>, messageAliases?: string[] }>
    : T extends ApplicationCommandSubCommandData
    ? Overwrite<Omit<T, "name">, { options?: CoreCommandArgs<CoreCommandOptionData<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>>>, messageAliases?: string[] }>
    : T extends ApplicationCommandAutoCompleterContainer
    ? Omit<T, "name"> & { autoCompleter: (interaction: AutocompleteInteraction, value: string | number | null) => Promise<void> }
    : Omit<T, "name">;

/** @typedef */
export type ApplicationCommandOptionsContainer = ApplicationCommandSubGroupData | ApplicationCommandSubCommandData;
/** @typedef */
export type ApplicationCommandValueContainer = Exclude<ApplicationCommandOptionData, ApplicationCommandOptionsContainer>;
/** @typedef */
export type ApplicationCommandAutoCompleterContainer = ApplicationCommandAutocompleteStringOptionData | ApplicationCommandAutocompleteNumericOptionData;

// TODO: simplify the type by removing APIInteractionDataResolvedGuildMember if possible.
/** @typedef */
export type GetValueType<T extends ApplicationCommandOptionType> =
    T extends ApplicationCommandOptionType.String ? string
    : T extends ApplicationCommandOptionType.Number ? number
    : T extends ApplicationCommandOptionType.Integer ? number // TODO: restrict to integer
    : T extends ApplicationCommandOptionType.Boolean ? boolean
    : T extends ApplicationCommandOptionType.User ? APIInteractionDataResolvedGuildMember | User | GuildMember
    : T extends ApplicationCommandOptionType.Channel ? GuildBasedChannel
    : T extends ApplicationCommandOptionType.Role ? Role | APIRole
    : T extends ApplicationCommandOptionType.Mentionable ? APIInteractionDataResolvedGuildMember | User | GuildMember | Role | APIRole
    : T extends ApplicationCommandOptionType.Attachment ? Attachment
    : never;

/** @typedef */
export type CoreCommandArgs<T extends CoreCommandOptionData = CoreCommandOptionData> = { [name: string]: T };

/** @typedef */
export type ConvertArgsType<T extends CoreCommandArgs | undefined> = T extends undefined ? undefined : {
    [K in keyof T]:
    T[K] extends CoreCommandOptionData<ApplicationCommandOptionsContainer> ? ConvertArgsType<T[K]["options"]>
    : T[K] extends CoreCommandOptionData<ApplicationCommandValueContainer> ? T[K]["required"] extends true ? GetValueType<T[K]["type"]> : GetValueType<T[K]["type"]> | undefined
    : never
};

/** @typedef */
export type CommandType = "SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU";

/** @typedef */
export interface CommandData<Args extends CoreCommandArgs> {
    readonly name: string;
    readonly description?: string;
    readonly messageCommandAliases?: string[];
    readonly args?: Args;
    readonly supports: CommandType[];
    readonly run: (ic: InteractionCore, args: ConvertArgsType<Args>, core: Core<true>) => Awaitable<void>;
}

export default class Command<Args extends CoreCommandArgs = CoreCommandArgs> {
    /**  */
    readonly data: CommandData<Args>;
    /**  */
    readonly name: string;
    /**  */
    readonly description: string | null;
    /**  */
    readonly messageCommandAliases: string[];
    /**  */
    readonly args: Args;
    /**  */
    readonly supports: CommandType[];
    /**  */
    readonly run: (ic: InteractionCore, args: ConvertArgsType<Args>, core: Core<true>) => Awaitable<void>;

    /**
     * @param data
    */
    constructor(data: CommandData<Args>) {
        this.data = data;
        this.name = this.data.name;
        this.description = this.data.description ?? null;
        this.args = this.data.args ?? {} as Args;
        this.messageCommandAliases = this.data.messageCommandAliases ?? [];
        this.supports = this.data.supports;
        this.run = this.data.run;
    }
}


export function isApplicationCommandOptionsContainer(commandOptionData?: ApplicationCommandOptionData | CoreCommandOptionData): commandOptionData is ApplicationCommandOptionsContainer {
    if (!commandOptionData) return false;
    return commandOptionData.type === ApplicationCommandOptionType.SubcommandGroup || commandOptionData.type === ApplicationCommandOptionType.Subcommand;
}