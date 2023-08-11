type OptionType = "STRING" | "INTEGER" | "BOOLEAN" | "USER" | "CHANNEL" | "ROLE" | "MENTIONABLE" | "NUMBER" | "SUB_COMMAND" | "SUB_COMMAND_GROUP";
type OptionsContainer = "SUB_COMMAND" | "SUB_COMMAND_GROUP";
type ValueContainer = Exclude<OptionType, OptionsContainer>;

type ConvertValueType<T extends ValueContainer> =
    T extends "STRING" ? string
    : T extends "INTEGER" ? number
    : T extends "BOOLEAN" ? boolean
    : T extends "USER" ? string
    : T extends "CHANNEL" ? string
    : T extends "ROLE" ? string
    : T extends "MENTIONABLE" ? string
    : T extends "NUMBER" ? number
    : never;

const options = {
    a: {
        type: "STRING",
    },
    b: {
        type: "SUB_COMMAND",
        options: {
            c: {
                type: "STRING",
            },
        },
    },
} as const;

type Args = { [name: string]: OptionData };
type OptionData<T extends OptionType = OptionType> = T extends OptionsContainer ? { type: T, options: Args } : { type: T };

type ConvertArgsType<T extends Args> = {
    [K in keyof T]: T[K] extends OptionData<OptionsContainer> ? ConvertArgsType<T[K]["options"]> : ConvertValueType<Extract<T[K]["type"], ValueContainer>>
};


type Converted = ConvertArgsType<typeof options>;

const converted: Converted = {} as unknown as Converted;
