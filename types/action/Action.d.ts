export = Action;
declare class Action {
    /**
     * @param {object} options
     * @param {Core} options.core
     */
    constructor(options: {
        core: Core;
    });
    /** @type {Core} */
    core: Core;
    /** @readonly @type {boolean} */
    readonly isAction: boolean;
    id: string;
}
import Core = require("../core/Core");
