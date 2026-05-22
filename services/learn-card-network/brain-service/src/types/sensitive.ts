export class Sensitive<T> {
    #value: T;

    private constructor(value: T) {
        this.#value = value;
    }

    static of<T>(value: T): Sensitive<T> {
        return new Sensitive(value);
    }

    reveal(): T {
        return this.#value;
    }

    toString(): string {
        return '[REDACTED]';
    }

    toJSON(): string {
        return '[REDACTED]';
    }
}

export const isSensitive = (value: unknown): value is Sensitive<unknown> => {
    return value instanceof Sensitive;
};
