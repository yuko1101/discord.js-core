"use strict";

const Core = require("./core/Core");
const Command = require("./command/Command");
const ConfigFile = require("./utils/ConfigFile");
const MessageCore = require("./message/MessageCore");
const MessagePages = require("./message/MessagePages");
const Pages = require("./message/Pages");
const CustomEmoji = require("./utils/CustomEmoji");
const EmojiAction = require("./action/EmojiAction");
const ButtonAction = require("./action/ButtonAction");
const Action = require("./action/Action");

module.exports = {
    Core: Core,
    Command: Command,
    ConfigFile: ConfigFile,
    MessageCore: MessageCore,
    MessagePages: MessagePages,
    Pages: Pages,
    CustomEmoji: CustomEmoji,
    EmojiAction: EmojiAction,
    ButtonAction: ButtonAction,
    Action: Action
}