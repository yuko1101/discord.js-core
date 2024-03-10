export class SimpleBuilder {
    also(func: (it: typeof this) => void): this {
        func(this);
        return this;
    }
}