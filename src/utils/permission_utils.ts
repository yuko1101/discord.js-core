import { ChannelType, Message } from "discord.js";

export async function canManageMessage(msg: Message): Promise<boolean> {
    if (msg.channel.type === ChannelType.DM || msg.guild === null) {
        return false;
    }

    const me = await msg.guild.members.fetchMe();
    return me.permissionsIn(msg.channel).has("ManageMessages");
}

export async function removeAllReactions(msg: Message) {
    if (msg.channel.type === ChannelType.DM || msg.guild === null) {
        await removeAllReactionsOneByOne(msg);
        return;
    }

    const me = await msg.guild.members.fetchMe();
    if (me.permissionsIn(msg.channel).has("ManageMessages")) {
        await msg.reactions.removeAll();
    } else {
        await removeAllReactionsOneByOne(msg);
    }
}

export async function removeAllReactionsOneByOne(msg: Message) {
    const promises = msg.reactions.cache.filter(reaction => reaction.me).map(reaction => reaction.users.remove());
    await Promise.all(promises);
}