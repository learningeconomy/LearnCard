const registry = {
    tile: 0,
    'caip10-link': 1,
    model: 2,
    MID: 3,
};
function codeByName(name) {
    const index = registry[name];
    if (typeof index !== 'undefined') {
        return index;
    }
    else {
        throw new Error(`No stream type registered for name ${name}`);
    }
}
function nameByCode(index) {
    const pair = Object.entries(registry).find(([, v]) => v === index);
    if (pair) {
        return pair[0];
    }
    else {
        throw new Error(`No stream type registered for index ${index}`);
    }
}
export class StreamType {
}
StreamType.nameByCode = nameByCode;
StreamType.codeByName = codeByName;
//# sourceMappingURL=stream-type.js.map