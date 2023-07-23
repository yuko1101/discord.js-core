import { ApplicationCommandAutocompleteNumericOptionData, ApplicationCommandAutocompleteStringOptionData, ApplicationCommandOptionData, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, AutocompleteInteraction } from "discord.js";
import { Overwrite } from "../utils/ts_utils";
import Core from "../core/Core";
import { SimpleObject } from "../core/handler";
import InteractionCore from "./InteractionCore";

/**
 * @typedef
 * Adds autoCompleter property to ApplicationCommandOptionData recursively.
 */
export type CoreApplicationCommandOptionData<T extends ApplicationCommandOptionData = ApplicationCommandOptionData> =
    T extends ApplicationCommandSubGroupData
    ? Overwrite<ApplicationCommandSubGroupData, { options?: CoreApplicationCommandOptionData<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData>>[] }>
    : T extends ApplicationCommandSubCommandData
    ? Overwrite<ApplicationCommandSubCommandData, { options?: CoreApplicationCommandOptionData<Exclude<ApplicationCommandOptionData, ApplicationCommandSubGroupData | ApplicationCommandSubCommandData>>[] }>
    : T extends ApplicationCommandAutoCompleterContainer
    ? T & { autoCompleter: (interaction: AutocompleteInteraction, value: string | number | null) => Promise<void> }
    : T;

/** @typedef */
export type ApplicationCommandOptionsContainer = ApplicationCommandSubGroupData | ApplicationCommandSubCommandData;
/** @typedef */
export type ApplicationCommandValueContainer = Exclude<ApplicationCommandOptionData, ApplicationCommandOptionsContainer>;
/** @typedef */
export type ApplicationCommandAutoCompleterContainer = ApplicationCommandAutocompleteStringOptionData | ApplicationCommandAutocompleteNumericOptionData;

/** @typedef */
export type CommandType = "SLASH_COMMAND" | "MESSAGE_COMMAND" | "USER_CONTEXT_MENU" | "MESSAGE_CONTEXT_MENU";

/** @typedef */
export interface CommandData {
    readonly name: string;
    readonly description?: string;
    readonly messageCommandAliases?: string[];
    readonly messageCommandArgs?: string[];
    readonly slashCommandOptions?: CoreApplicationCommandOptionData[];
    readonly supports: CommandType[];
    readonly run: (ic: InteractionCore, args: SimpleObject<string | number | boolean>, core: Core<true>) => Promise<void>;
}

export default class Command {
    /**  */
    readonly data: CommandData;
    /**  */
    readonly name: string;
    /**  */
    readonly description: string | null;
    /**  */
    readonly messageCommandAliases: string[];
    /**  */
    readonly messageCommandArgs: string[];
    /**  */
    readonly slashCommandOptions: CoreApplicationCommandOptionData[];
    /**  */
    readonly supports: CommandType[];
    /**  */
    readonly run: (ic: InteractionCore, args: SimpleObject<string | number | boolean>, core: Core<true>) => Promise<void>;

    /**
     * @param data
     */
    constructor(data: CommandData) {
        this.data = data;
        this.name = this.data.name;
        this.description = this.data.description ?? null;
        this.messageCommandArgs = this.data.messageCommandArgs ?? [];
        this.slashCommandOptions = this.data.slashCommandOptions ?? [];
        this.messageCommandAliases = this.data.messageCommandAliases ?? [];
        this.supports = this.data.supports;
        this.run = this.data.run;
    }
}