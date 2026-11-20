/*
 * Runs code from the JavaScript playground, in a Web Worker (a background thread).
 * The page sends the code as a message. console.log and errors come back as messages.
 * A worker can't touch the page, so an infinite loop here never freezes it: the page just stops the worker.
 */

const MAX_DEPTH = 4;

/** Prints a value the way Node's console.log does: [ 1, 2 ], { a: 1 }, Map(1) { 'a' => 1 }, [Circular]. */
function format(value, depth, seen) {
    if (typeof value === "string") {
        // Top-level strings print as they are. Strings inside arrays or objects get quotes.
        if (depth === 0) {
            return value;
        }
        return "'" + value + "'";
    }

    if (typeof value === "function") {
        return "[Function: " + (value.name || "anonymous") + "]";
    }

    if (typeof value === "bigint") {
        return value + "n";
    }

    if (value === null || typeof value !== "object") {
        return String(value);
    }

    if (seen.has(value)) {
        return "[Circular]";
    }

    // An error prints as "TypeError: x is not a function".
    // The name and message check also catches errors made somewhere `instanceof Error` can't see.
    const looksLikeError = typeof value.name === "string" && typeof value.message === "string" && "stack" in value;
    if (value instanceof Error || looksLikeError) {
        return value.name + ": " + value.message;
    }

    if (depth > MAX_DEPTH) {
        if (Array.isArray(value)) {
            return "[Array]";
        }
        return "[Object]";
    }

    seen.add(value);
    const text = formatObject(value, depth, seen);
    seen.delete(value);
    return text;
}

function formatObject(value, depth, seen) {
    const inner = (item) => format(item, depth + 1, seen);

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "[]";
        }
        return "[ " + value.map(inner).join(", ") + " ]";
    }

    if (value instanceof Map) {
        const pairs = [];
        for (const [key, item] of value) {
            pairs.push(inner(key) + " => " + inner(item));
        }
        return "Map(" + value.size + ") { " + pairs.join(", ") + " }";
    }

    if (value instanceof Set) {
        const items = [];
        for (const item of value) {
            items.push(inner(item));
        }
        return "Set(" + value.size + ") { " + items.join(", ") + " }";
    }

    // A plain object prints as { ... }. A class object gets its class name first: ListNode { ... }
    const className = value.constructor && value.constructor.name;
    const prefix = className && className !== "Object" ? className + " " : "";

    const keys = Object.keys(value);
    if (keys.length === 0) {
        return prefix + "{}";
    }

    const fields = keys.map((key) => key + ": " + inner(value[key]));
    return prefix + "{ " + fields.join(", ") + " }";
}

function send(type, args) {
    const parts = args.map((arg) => format(arg, 0, new Set()));
    self.postMessage({ type: type, text: parts.join(" ") });
}

console.log = (...args) => send("log", args);
console.info = (...args) => send("log", args);
console.debug = (...args) => send("log", args);
console.table = (...args) => send("log", args);
console.warn = (...args) => send("warn", args);
console.error = (...args) => send("error", args);

// An error thrown later, inside a setTimeout or a promise, still shows up.
self.addEventListener("error", (event) => {
    send("error", [event.message]);
});
self.addEventListener("unhandledrejection", (event) => {
    send("error", ["Uncaught (in promise)", event.reason]);
});

// Runs the code inside an async function, so `await` works at the top level.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

self.onmessage = async (event) => {
    try {
        const run = new AsyncFunction(event.data);
        await run();
    } catch (error) {
        send("error", [error]);
    }

    // The main code has finished. Timers it started can still log after this.
    self.postMessage({ type: "done" });
};
