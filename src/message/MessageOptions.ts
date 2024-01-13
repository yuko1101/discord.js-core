import { ActionRowBuilder, ButtonBuilder, ComponentType, Message, MessageCreateOptions, PartialMessage } from "discord.js";
import { SelectMenuBuilderType } from "../action/SelectMenuAction";
import EmojiAction from "../action/EmojiAction";

export type CoreComponents = (ButtonBuilder[] | SelectMenuBuilderType<ComponentType> | EmojiAction)[];

export type CoreMessageCreateOptions = Omit<MessageCreateOptions, "components"> & { actions: CoreComponents };

export function convertToMessageOptions(options: CoreMessageCreateOptions): MessageCreateOptions {
    const components: (ButtonBuilder[] | SelectMenuBuilderType<ComponentType>)[] = options.actions.filter((row): row is (ButtonBuilder[] | SelectMenuBuilderType<ComponentType>) => !(row instanceof EmojiAction));

    const actionRows: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<SelectMenuBuilderType<ComponentType>>)[] = components.map(row => {
        if (Array.isArray(row)) {
            return new ActionRowBuilder().addComponents(...row) as ActionRowBuilder<ButtonBuilder>;
        } else {
            return new ActionRowBuilder().addComponents(row) as ActionRowBuilder<SelectMenuBuilderType<ComponentType>>;
        }
    });

    return { ...options, components: actionRows };
}

export async function removeReactions(msg: Message | PartialMessage, original: CoreMessageCreateOptions, fastMode = false) {
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

export function getEmojiActions(coreMessageOptions: CoreMessageCreateOptions): EmojiAction[] {
    return (coreMessageOptions.actions.filter(row => row instanceof EmojiAction)) as EmojiAction[];
}