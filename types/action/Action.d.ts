export = Action;
declare class Action {
    /**
     * @param {object} options
     * @param {string} options.label
     * @param {Core} options.core
     */
    constructor(options: {
        label: string;
        core: Core;
    });
    /** @type {Core} */
    core: Core;
    /** @type {string} */
    label: string;
    /** @readonly @type {boolean} */
    readonly isAction: boolean;
    id: string;
}
import Core = require("../core/Core");
