import { ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, MentionableSelectMenuBuilder, MentionableSelectMenuInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js";
import Action, { ActionOptions } from "./Action";
import { devModeCommandPrefix } from "../core/commandManager";

/** @typedef */
export type SelectMenuInteractions =
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction
    | RoleSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | ChannelSelectMenuInteraction;

/** @typedef */
export type SelectMenuBuilderType<Interaction extends SelectMenuInteractions> =
    Interaction extends StringSelectMenuBuilder
    ? StringSelectMenuBuilder
    : Interaction extends UserSelectMenuInteraction
    ? UserSelectMenuBuilder
    : Interaction extends RoleSelectMenuInteraction
    ? RoleSelectMenuBuilder
    : Interaction extends MentionableSelectMenuInteraction
    ? MentionableSelectMenuBuilder
    : ChannelSelectMenuBuilder;

// TODO: better typedef
/** @typedef */
export type AnySelectMenuAction =
    | SelectMenuAction<StringSelectMenuInteraction>
    | SelectMenuAction<UserSelectMenuInteraction>
    | SelectMenuAction<RoleSelectMenuInteraction>
    | SelectMenuAction<MentionableSelectMenuInteraction>
    | SelectMenuAction<ChannelSelectMenuInteraction>;

/** @typedef */
export interface SelectMenuActionOptions<Interaction extends SelectMenuInteractions> extends ActionOptions {
    readonly selectMenu: SelectMenuBuilderType<Interaction>;
    readonly run: (interaction: Interaction) => Promise<void>;
}

/** @extends {Action} */
export default class SelectMenuAction<Interaction extends SelectMenuInteractions = SelectMenuInteractions> extends Action {
    /**  */
    readonly options: SelectMenuActionOptions<Interaction>;
    /**  */
    readonly selectMenu: SelectMenuBuilderType<Interaction>;
    /**  */
    run: (interaction: Interaction) => Promise<void>;
    /**  */
    readonly customId: string;

    /**
     * @param options
     */
    constructor(options: SelectMenuActionOptions<Interaction>) {
        super(options);
        this.options = options;

        this.selectMenu = this.options.selectMenu;

        this.run = this.options.run;

        if (this.selectMenu.data.custom_id === undefined) throw new Error("custom_id of selectMenu is required.");
        this.customId = `${this.core.options.devMode ? devModeCommandPrefix : ""}${this.selectMenu.data.custom_id}`;

        this.selectMenu.setCustomId(this.customId);

    }

    /**  */
    register(): this {
        if (!this.core.selectMenuActions.includes(this as unknown as AnySelectMenuAction)) {
            // TODO: better way to avoid casting errors
            this.core.selectMenuActions.push(this as unknown as AnySelectMenuAction);
        }
        return this;
    }

    /**  */
    unregister(): this {
        const index = this.core.selectMenuActions.indexOf(this as unknown as AnySelectMenuAction);
        if (index !== -1) {
            this.core.selectMenuActions.splice(index, 1);
        }
        return this;
    }

}