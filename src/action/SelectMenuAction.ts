import { ChannelSelectMenuComponentData, ChannelSelectMenuInteraction, MentionableSelectMenuComponentData, MentionableSelectMenuInteraction, RoleSelectMenuComponentData, RoleSelectMenuInteraction, StringSelectMenuComponentData, StringSelectMenuInteraction, UserSelectMenuComponentData, UserSelectMenuInteraction } from "discord.js";
import { ActionOptions, InteractionAction } from "./Action";
import { JsonElement } from "config_file.js";

/** @typedef */
export type SelectMenuInteractions =
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction
    | RoleSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | ChannelSelectMenuInteraction;

/** @typedef */
export type SelectMenuComponentData =
    | StringSelectMenuComponentData
    | UserSelectMenuComponentData
    | RoleSelectMenuComponentData
    | MentionableSelectMenuComponentData
    | ChannelSelectMenuComponentData;

/** @typedef */
export type SelectMenuInteractionType<T extends SelectMenuComponentData> =
    T extends StringSelectMenuComponentData
    ? StringSelectMenuInteraction
    : T extends UserSelectMenuComponentData
    ? UserSelectMenuInteraction
    : T extends RoleSelectMenuComponentData
    ? RoleSelectMenuInteraction
    : T extends MentionableSelectMenuComponentData
    ? MentionableSelectMenuInteraction
    : T extends ChannelSelectMenuComponentData
    ? ChannelSelectMenuInteraction
    : never;

/** @typedef */
export interface SelectMenuActionOptions<T extends SelectMenuComponentData> extends ActionOptions {
    readonly selectMenu: T;
    readonly run: (interaction: SelectMenuInteractionType<T>, data: JsonElement | undefined) => Promise<void>;
}

/** @extends {InteractionAction} */
export default class SelectMenuAction<T extends SelectMenuComponentData = SelectMenuComponentData> extends InteractionAction {
    /**  */
    readonly options: SelectMenuActionOptions<T>;
    /**  */
    readonly selectMenu: T;
    /**  */
    run: (interaction: SelectMenuInteractionType<T>, data: JsonElement | undefined) => Promise<void>;

    /**
     * @param options
     */
    constructor(options: SelectMenuActionOptions<T>) {
        super({ ...options, customId: options.selectMenu.customId });
        this.options = options;

        this.selectMenu = this.options.selectMenu;

        this.run = this.options.run;
    }

    getComponent(data: JsonElement | undefined = undefined): T {
        return { ...this.selectMenu, customId: this.getCustomIdWithData(data) };
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