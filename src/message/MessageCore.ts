import { ActionRowBuilder, BaseInteraction, BaseMessageOptions, ButtonBuilder, Message, MessageCreateOptions, PartialMessage, TextBasedChannel } from "discord.js";
import ButtonAction from "../action/ButtonAction";
import EmojiAction from "../action/EmojiAction";
import { bindOptions } from "config_file.js";

/** @typedef */
export interface MessageCoreOptions {
    readonly message: MessageCreateOptions;
    /** ButtonActions for each row */
    readonly buttonActions?: ButtonAction[][];
    readonly emojiActions?: EmojiAction[];
}

/**  */
export default class MessageCore {
    /**  */
    readonly message: BaseMessageOptions;
    /**  */
    readonly buttonActions: ButtonAction[][];
    /**  */
    readonly emojiActions: EmojiAction[];

    /**
     * @param data
     */
    constructor(data: MessageCoreOptions) {
        this.message = data.message;
        this.buttonActions = data.buttonActions ?? [];
        this.emojiActions = data.emojiActions ?? [];
    }

    /**  */
    getComponents(): ActionRowBuilder<ButtonBuilder>[] {
        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        const buttonComponents = this.buttonActions.map(actions => {
            const row = new ActionRowBuilder<ButtonBuilder>();
            for (const action of actions) {
                row.addComponents(action.getComponent());
            }
            return row;
        });

        components.push(...buttonComponents);
        return components;
    }

    /** @param buttonActions */
    addButtonsAsNewRow(buttonActions: ButtonAction[]) {
        this.buttonActions.push(buttonActions);
    }


    /**
     * Get the complete message object to send.
     */
    getMessage(): BaseMessageOptions {
        const messageCreateOptions: BaseMessageOptions = { ...this.message }; // make immutable
        const components = this.getComponents();
        messageCreateOptions.components = [...(messageCreateOptions.components ?? []), ...components];
        return messageCreateOptions;
    }

    /** @returns {string[]} */
    getEmojis() {
        return this.emojiActions.map(action => action.emoji);
    }

    /**
     * @param message
     * @param options
     */
    async apply(message: Message | PartialMessage, options: { timeout?: number, autoReact?: boolean } = {}) {
        for (const action of this.emojiActions) {
            await action.apply(message, options);
        }
    }


    /**
     * @param message
     * @param options
     */
    async removeApply(message: Message | PartialMessage, options: { autoRemoveReaction?: boolean, fastMode?: boolean } = {}) {
        if (this.emojiActions.length === 0) return;
        const fastMode = options.fastMode ?? false;
        delete options.fastMode;
        if (fastMode) {
            await new Promise<void>(resolve => {
                let count = 0;
                this.emojiActions.forEach(action => {
                    action.removeApply(message, options).then(() => {
                        count++;
                        if (count === this.emojiActions.length) resolve();
                    });
                });
            });
        } else {
            for (const action of this.emojiActions) {
                await action.removeApply(message, options);
            }
        }
    }

    /**
     * @param channel
     * @param options
     */
    async sendTo(channel: TextBasedChannel, options: { autoApplyEmojiActions?: boolean } = {}): Promise<Message> {
        options = bindOptions({ autoApplyEmojiActions: true }, options);
        const message = await channel.send(this.getMessage());
        if (options.autoApplyEmojiActions) {
            for (const action of this.emojiActions) {
                await action.apply(message);
            }
        }
        return message;
    }

    async interactionReply(interaction: BaseInteraction, options: { autoApplyEmojiActions?: boolean, followUp?: boolean, ephemeral?: boolean } = {}): Promise<Message> {
        options = bindOptions({
            autoApplyEmojiActions: true,
            followUp: false,
            ephemeral: false,
        }, options);
        if ((options.ephemeral || (interaction.isCommand() && interaction.ephemeral)) && this.emojiActions.length !== 0) {
            throw new Error("You cannot add reactions to ephemeral messages.");
        }
        const messageCreateOptions = { ...this.getMessage(), flags: [], ephemeral: options.ephemeral };
        const message = options.followUp && interaction.isCommand() ? await interaction.followUp(messageCreateOptions) : interaction.isRepliable() ? await interaction.reply({ ...messageCreateOptions, fetchReply: true }) : null;
        if (message === null) throw new Error("Couldn't send the message because provided interaction was not repliable.");
        this.buttonActions.forEach(array => array.forEach(action => action.register()));
        if (options.autoApplyEmojiActions) {
            await this.apply(message, { autoReact: true });
        }
        return message;
    }
}