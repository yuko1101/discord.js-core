"use strict";

const Core = require("./core/Core");
const Command = require("./command/Command");
const ConfigFile = require("./utils/ConfigFile");
const MessageCore = require("./message/MessageCore");
const MessagePages = require("./message/MessagePages");
const CustomEmoji = require("./utils/CustomEmoji");
const EmojiAction = require("./action/EmojiAction");
const ButtonAction = require("./action/ButtonAction");
const SelectMenuAction = require("./action/SelectMenuAction");
const Action = require("./action/Action");
const InteractionCore = require("./command/InteractionCore");

/** @module Core */
module.exports.Core = Core;
/** @module Command */
module.exports.Command = Command;
/** @module ConfigFile */
module.exports.ConfigFile = ConfigFile;
/** @module MessageCore */
module.exports.MessageCore = MessageCore;
/** @module MessagePages */
module.exports.MessagePages = MessagePages;
/** @module CustomEmoji */
module.exports.CustomEmoji = CustomEmoji;
/** @module EmojiAction */
module.exports.EmojiAction = EmojiAction;
/** @module ButtonAction */
module.exports.ButtonAction = ButtonAction;
/** @module SelectMenuAction */
module.exports.SelectMenuAction = SelectMenuAction;
/** @module Action */
module.exports.Action = Action;
/** @module InteractionCore */
module.exports.InteractionCore = InteractionCore;