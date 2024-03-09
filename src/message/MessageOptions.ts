import { ActionRowBuilder, ButtonBuilder, ComponentType, Message, BaseMessageOptions, PartialMessage } from "discord.js";
import { SelectMenuBuilderType } from "../action/SelectMenuAction";
import EmojiAction from "../action/EmojiAction";

export type CoreComponents = (ButtonBuilder[] | SelectMenuBuilderType<ComponentType> | EmojiAction)[];

export type CoreMessageOptions<T extends BaseMessageOptions> = Omit<T, "components"> & { actions: CoreComponents };

export function convertToMessageOptions<T extends BaseMessageOptions>(options: CoreMessageOptions<T>): T {
    const components: (ButtonBuilder[] | SelectMenuBuilderType<ComponentType>)[] = options.actions.filter((row): row is (ButtonBuilder[] | SelectMenuBuilderType<ComponentType>) => !(row instanceof EmojiAction));

    const actionRows: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<SelectMenuBuilderType<ComponentType>>)[] = components.map(row => {
        if (Array.isArray(row)) {
            return new ActionRowBuilder().addComponents(...row) as ActionRowBuilder<ButtonBuilder>;
        } else {
            return new ActionRowBuilder().addComponents(row) as ActionRowBuilder<SelectMenuBuilderType<ComponentType>>;
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { actions: _, ...converted } = { ...options, components: actionRows };
    return converted as unknown as T;
}

export async function removeReactions<T extends BaseMessageOptions>(msg: Message | PartialMessage, original: CoreMessageOptions<T>, fastMode = false) {
    const emojiActions = getEmojiActions(original);
    if (emojiActions.length === 0) return;
    if (fastMode) {
        return await Promise.all(emojiActions.map(action => async () => {
            await action.removeApply(msg, { autoRemoveReaction: true });
        }));
    } else {
        for (const action of emojiActions) {
            await action.removeApply(msg, { autoRemoveReaction: true });
        }
    }
}

export function getEmojiActions<T extends BaseMessageOptions>(coreMessageOptions: CoreMessageOptions<T>): EmojiAction[] {
    return (coreMessageOptions.actions.filter(row => row instanceof EmojiAction)) as EmojiAction[];
}