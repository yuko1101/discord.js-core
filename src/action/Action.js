// Action is a message action which is a reaction or a button.

const Core = require("../core/Core");
const { generateUuid } = require("../utils/utils");

module.exports = class Action {
    /**
     * @param {object} options 
     * @param {Core} options.core
     */
    constructor(options) {
        if (!options.core) throw new Error("options.core is required.");

        /** @type {Core} */
        this.core = options.core;

        /** @readonly @type {boolean} */
        this.isAction = true;

        this.id = generateUuid();
    }
}