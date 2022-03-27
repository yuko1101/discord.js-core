"use strict";

const Core = require("./core/Core");
const Command = require("./command/Command");
// const Reaction = require("./Reaction");
const ConfigFile = require("./utils/ConfigFile");
const Pages = require("./utils/Pages");
const CustomEmoji = require("./utils/CustomEmoji");
const EmojiAction = require("./action/EmojiAction");
const ButtonAction = require("./action/ButtonAction");
const Action = require("./action/Action");

module.exports = {
    Core: Core,
    Command: Command,
    // Reaction,
    ConfigFile: ConfigFile,
    Pages: Pages,
    CustomEmoji: CustomEmoji,
    EmojiAction: EmojiAction,
    ButtonAction: ButtonAction,
    Action: Action
}