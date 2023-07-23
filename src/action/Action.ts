import { generateUuid } from "config_file.js";
import Core from "../core/Core";

/** @typedef */
export interface ActionOptions {
    readonly core: Core;
}

/** Action is a message action which is a reaction or a button. */
export default class Action {
    /**  */
    readonly core: Core;
    /** UUID */
    readonly id: string;

    /**
     * @param options
     */
    constructor(options: { core: Core }) {
        /** @type {Core} */
        this.core = options.core;

        this.id = generateUuid();
    }
}