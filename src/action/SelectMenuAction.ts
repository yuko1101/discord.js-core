import { APIChannelSelectComponent, APIMentionableSelectComponent, APIRoleSelectComponent, APIUserSelectComponent, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, MentionableSelectMenuBuilder, MentionableSelectMenuInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js";
import { InteractionAction, InteractionActionOptions } from "./Action";
import { JsonElement } from "config_file.js";

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
export interface SelectMenuActionOptions<Interaction extends SelectMenuInteractions> extends InteractionActionOptions {
    readonly selectMenu: SelectMenuBuilderType<Interaction>;
    readonly run: (interaction: Interaction, data: JsonElement | undefined) => Promise<void>;
}

/** @extends {InteractionAction} */
export default class SelectMenuAction<Interaction extends SelectMenuInteractions = SelectMenuInteractions> extends InteractionAction {
    /**  */
    readonly options: SelectMenuActionOptions<Interaction>;
    /**  */
    readonly _selectMenu: SelectMenuBuilderType<Interaction>;
    /**  */
    run: (interaction: Interaction, data: JsonElement | undefined) => Promise<void>;

    /**
     * @param options
     */
    constructor(options: SelectMenuActionOptions<Interaction>) {
        super(options);
        this.options = options;

        this._selectMenu = this.options.selectMenu;
        this._selectMenu.setCustomId(this.customId);

        this.run = this.options.run;
    }

    getComponent(data: JsonElement | undefined = undefined): SelectMenuBuilderType<Interaction> {
        const constructor = this._selectMenu.constructor as unknown as new (selectMenu: APIUserSelectComponent | APIRoleSelectComponent | APIMentionableSelectComponent | APIChannelSelectComponent) => SelectMenuBuilderType<Interaction>;
        const component = new constructor(this._selectMenu.toJSON()) as SelectMenuBuilderType<Interaction>;
        component.setCustomId(this.getCustomIdWithData(data));
        return component;
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