import Core from "../core/Core";

/** @typedef */
export interface ActionOptions {
    readonly core: Core;
}

/** Action is a message action which is a reaction or a button. */
export default class Action {
    /**  */
    readonly core: Core;

    /**
     * @param options
     */
    constructor(options: { core: Core }) {
        this.core = options.core;
    }
}