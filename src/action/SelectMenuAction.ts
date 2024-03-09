import { ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ComponentType, MentionableSelectMenuBuilder, MentionableSelectMenuInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js";
import { InteractiveAction, InteractiveActionOptions } from "./Action";
import { JsonElement } from "config_file.js";

/** @typedef */
export type SelectMenuInteractionType<T extends ComponentType> =
    T extends ComponentType.StringSelect
    ? StringSelectMenuInteraction
    : T extends ComponentType.UserSelect
    ? UserSelectMenuInteraction
    : T extends ComponentType.RoleSelect
    ? RoleSelectMenuInteraction
    : T extends ComponentType.MentionableSelect
    ? MentionableSelectMenuInteraction
    : T extends ComponentType.ChannelSelect
    ? ChannelSelectMenuInteraction
    : never;

/** @typedef */
export type SelectMenuBuilderType<T extends ComponentType> =
    T extends ComponentType.StringSelect
    ? StringSelectMenuBuilder
    : T extends ComponentType.UserSelect
    ? UserSelectMenuBuilder
    : T extends ComponentType.RoleSelect
    ? RoleSelectMenuBuilder
    : T extends ComponentType.MentionableSelect
    ? MentionableSelectMenuBuilder
    : T extends ComponentType.ChannelSelect
    ? ChannelSelectMenuBuilder
    : never;

/** @typedef */
export interface SelectMenuActionOptions<T extends ComponentType> extends InteractiveActionOptions {
    readonly type: T;
    readonly selectMenu: SelectMenuBuilderType<T>;
    readonly run: (interaction: SelectMenuInteractionType<T>, data: JsonElement | undefined) => Promise<void>;
}

/** @extends {InteractiveAction} */
export default class SelectMenuAction<T extends ComponentType> extends InteractiveAction {
    /**  */
    readonly options: SelectMenuActionOptions<T>;
    /**  */
    readonly type: T;
    /**  */
    readonly selectMenu: SelectMenuBuilderType<T>;
    /**  */
    run: (interaction: SelectMenuInteractionType<T>, data: JsonElement | undefined) => Promise<void>;

    /**
     * @param options
     */
    constructor(options: SelectMenuActionOptions<T>) {
        super(options);
        this.options = options;

        this.type = this.options.type;
        this.selectMenu = this.options.selectMenu;

        this.run = this.options.run;
    }

    getComponent(data: JsonElement | undefined = undefined): SelectMenuBuilderType<T> {
        const customId = this.getCustomIdWithData(data);
        const constructor = this.selectMenu.constructor as new (selectMenuData: typeof this.selectMenu.data) => SelectMenuBuilderType<T>;
        const selectMenu = new constructor({ ...this.selectMenu.data }).setCustomId(customId);
        return selectMenu as SelectMenuBuilderType<T>;
    }

    /**  */
    register(): this {
        if (!this.core.selectMenuActions.includes(this)) {
            this.core.selectMenuActions.push(this);
        }
        return this;
    }

    /**  */
    unregister(): this {
        const index = this.core.selectMenuActions.indexOf(this);
        if (index !== -1) {
            this.core.selectMenuActions.splice(index, 1);
        }
        return this;
    }

}