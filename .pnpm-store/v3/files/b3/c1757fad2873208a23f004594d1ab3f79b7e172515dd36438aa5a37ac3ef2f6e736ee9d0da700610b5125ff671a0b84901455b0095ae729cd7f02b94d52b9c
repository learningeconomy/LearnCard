"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/utils/misc/isElementType.ts
function isElementType(element, tag, props) {
  if (element.namespaceURI && element.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    return false;
  }
  tag = Array.isArray(tag) ? tag : [tag];
  if (!tag.includes(element.tagName.toLowerCase())) {
    return false;
  }
  if (props) {
    return Object.entries(props).every(([k, v]) => element[k] === v);
  }
  return true;
}

// src/utils/click/isClickableInput.ts
var CLICKABLE_INPUT_TYPES = [
  "button",
  "color",
  "file",
  "image",
  "reset",
  "submit",
  "checkbox",
  "radio"
];
function isClickableInput(element) {
  return isElementType(element, "button") || isElementType(element, "input") && CLICKABLE_INPUT_TYPES.includes(element.type);
}

// src/utils/dataTransfer/Blob.ts
function readBlobText(blob, FileReader) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onabort = rej;
    fr.onload = () => {
      res(String(fr.result));
    };
    fr.readAsText(blob);
  });
}

// src/utils/dataTransfer/FileList.ts
function createFileList(files) {
  const list = __spreadProps(__spreadValues({}, files), {
    length: files.length,
    item: (index) => list[index],
    [Symbol.iterator]: function* nextFile() {
      for (let i = 0; i < list.length; i++) {
        yield list[i];
      }
    }
  });
  list.constructor = FileList;
  Object.setPrototypeOf(list, FileList.prototype);
  Object.freeze(list);
  return list;
}

// src/utils/dataTransfer/DataTransfer.ts
var DataTransferItemStub = class {
  constructor(dataOrFile, type3) {
    this.file = null;
    this.data = void 0;
    if (typeof dataOrFile === "string") {
      this.kind = "string";
      this.type = String(type3);
      this.data = dataOrFile;
    } else {
      this.kind = "file";
      this.type = dataOrFile.type;
      this.file = dataOrFile;
    }
  }
  getAsFile() {
    return this.file;
  }
  getAsString(callback) {
    if (typeof this.data === "string") {
      callback(this.data);
    }
  }
  webkitGetAsEntry() {
    throw new Error("not implemented");
  }
};
var DataTransferItemListStub = class extends Array {
  add(...args) {
    const item = new DataTransferItemStub(args[0], args[1]);
    this.push(item);
    return item;
  }
  clear() {
    this.splice(0, this.length);
  }
  remove(index) {
    this.splice(index, 1);
  }
};
function getTypeMatcher(type3, exact) {
  const [group, sub] = type3.split("/");
  const isGroup = !sub || sub === "*";
  return (item) => {
    return exact ? item.type === (isGroup ? group : type3) : isGroup ? item.type.startsWith(`${group}/`) : item.type === group;
  };
}
var DataTransferStub = class {
  constructor() {
    this.dropEffect = "none";
    this.effectAllowed = "uninitialized";
    this.items = new DataTransferItemListStub();
    this.files = createFileList([]);
  }
  getData(format) {
    var _a;
    const match = (_a = this.items.find(getTypeMatcher(format, true))) != null ? _a : this.items.find(getTypeMatcher(format, false));
    let text = "";
    match == null ? void 0 : match.getAsString((t) => {
      text = t;
    });
    return text;
  }
  setData(format, data) {
    const matchIndex = this.items.findIndex(getTypeMatcher(format, true));
    const item = new DataTransferItemStub(data, format);
    if (matchIndex >= 0) {
      this.items.splice(matchIndex, 1, item);
    } else {
      this.items.push(item);
    }
  }
  clearData(format) {
    if (format) {
      const matchIndex = this.items.findIndex(getTypeMatcher(format, true));
      if (matchIndex >= 0) {
        this.items.remove(matchIndex);
      }
    } else {
      this.items.clear();
    }
  }
  get types() {
    const t = [];
    if (this.files.length) {
      t.push("Files");
    }
    this.items.forEach((i) => t.push(i.type));
    Object.freeze(t);
    return t;
  }
  setDragImage() {
  }
};
function createDataTransfer(window, files = []) {
  const dt = typeof window.DataTransfer === "undefined" ? new DataTransferStub() : new window.DataTransfer();
  Object.defineProperty(dt, "files", { get: () => createFileList(files) });
  return dt;
}
function getBlobFromDataTransferItem(window, item) {
  if (item.kind === "file") {
    return item.getAsFile();
  }
  let data = "";
  item.getAsString((s) => {
    data = s;
  });
  return new window.Blob([data], { type: item.type });
}

// src/utils/misc/getWindow.ts
import { getWindowFromNode } from "@testing-library/dom/dist/helpers.js";
function getWindow(node) {
  return getWindowFromNode(node);
}

// src/utils/dataTransfer/Clipboard.ts
function createClipboardItem(window, ...blobs) {
  const dataMap = Object.fromEntries(blobs.map((b) => [
    typeof b === "string" ? "text/plain" : b.type,
    Promise.resolve(b)
  ]));
  if (typeof window.ClipboardItem !== "undefined") {
    return new window.ClipboardItem(dataMap);
  }
  return new class ClipboardItem {
    constructor(d) {
      this.data = d;
    }
    get types() {
      return Array.from(Object.keys(this.data));
    }
    getType(type3) {
      return __async(this, null, function* () {
        const value = yield this.data[type3];
        if (!value) {
          throw new Error(`${type3} is not one of the available MIME types on this item.`);
        }
        return value instanceof window.Blob ? value : new window.Blob([value], { type: type3 });
      });
    }
  }(dataMap);
}
var ClipboardStubControl = Symbol("Manage ClipboardSub");
function createClipboardStub(window, control) {
  return Object.assign(new class Clipboard extends window.EventTarget {
    constructor() {
      super(...arguments);
      this.items = [];
    }
    read() {
      return __async(this, null, function* () {
        return Array.from(this.items);
      });
    }
    readText() {
      return __async(this, null, function* () {
        let text = "";
        for (const item of this.items) {
          const type3 = item.types.includes("text/plain") ? "text/plain" : item.types.find((t) => t.startsWith("text/"));
          if (type3) {
            text += yield item.getType(type3).then((b) => readBlobText(b, window.FileReader));
          }
        }
        return text;
      });
    }
    write(data) {
      return __async(this, null, function* () {
        this.items = data;
      });
    }
    writeText(text) {
      return __async(this, null, function* () {
        this.items = [createClipboardItem(window, text)];
      });
    }
  }(), {
    [ClipboardStubControl]: control
  });
}
function isClipboardStub(clipboard) {
  return !!(clipboard == null ? void 0 : clipboard[ClipboardStubControl]);
}
function attachClipboardStubToView(window) {
  if (isClipboardStub(window.navigator.clipboard)) {
    return window.navigator.clipboard[ClipboardStubControl];
  }
  const realClipboard = Object.getOwnPropertyDescriptor(window.navigator, "clipboard");
  let stub;
  const control = {
    resetClipboardStub: () => {
      stub = createClipboardStub(window, control);
    },
    detachClipboardStub: () => {
      if (realClipboard) {
        Object.defineProperty(window.navigator, "clipboard", realClipboard);
      } else {
        Object.defineProperty(window.navigator, "clipboard", {
          value: void 0,
          configurable: true
        });
      }
    }
  };
  stub = createClipboardStub(window, control);
  Object.defineProperty(window.navigator, "clipboard", {
    get: () => stub,
    configurable: true
  });
  return stub[ClipboardStubControl];
}
function resetClipboardStubOnView(window) {
  if (isClipboardStub(window.navigator.clipboard)) {
    window.navigator.clipboard[ClipboardStubControl].resetClipboardStub();
  }
}
function detachClipboardStubFromView(window) {
  if (isClipboardStub(window.navigator.clipboard)) {
    window.navigator.clipboard[ClipboardStubControl].detachClipboardStub();
  }
}
function readDataTransferFromClipboard(document) {
  return __async(this, null, function* () {
    const window = document.defaultView;
    const clipboard = window == null ? void 0 : window.navigator.clipboard;
    const items = clipboard && (yield clipboard.read());
    if (!items) {
      throw new Error("The Clipboard API is unavailable.");
    }
    const dt = createDataTransfer(window);
    for (const item of items) {
      for (const type3 of item.types) {
        dt.setData(type3, yield item.getType(type3).then((b) => readBlobText(b, window.FileReader)));
      }
    }
    return dt;
  });
}
function writeDataTransferToClipboard(document, clipboardData) {
  return __async(this, null, function* () {
    const window = getWindow(document);
    const clipboard = window.navigator.clipboard;
    const items = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
      const dtItem = clipboardData.items[i];
      const blob = getBlobFromDataTransferItem(window, dtItem);
      items.push(createClipboardItem(window, blob));
    }
    const written = clipboard && (yield clipboard.write(items).then(() => true, () => false));
    if (!written) {
      throw new Error("The Clipboard API is unavailable.");
    }
  });
}
if (typeof globalThis.afterEach === "function") {
  globalThis.afterEach(() => resetClipboardStubOnView(globalThis.window));
}
if (typeof globalThis.afterAll === "function") {
  globalThis.afterAll(() => detachClipboardStubFromView(globalThis.window));
}

// src/utils/edit/isContentEditable.ts
function isContentEditable(element) {
  return element.hasAttribute("contenteditable") && (element.getAttribute("contenteditable") == "true" || element.getAttribute("contenteditable") == "");
}
function getContentEditable(node) {
  const element = getElement(node);
  return element && (element.closest('[contenteditable=""]') || element.closest('[contenteditable="true"]'));
}
function getElement(node) {
  return node.nodeType === 1 ? node : node.parentElement;
}

// src/utils/edit/getValue.ts
function getValue(element) {
  if (!element) {
    return null;
  }
  if (isContentEditable(element)) {
    return element.textContent;
  }
  return getUIValue(element);
}

// src/utils/edit/buildTimeValue.ts
var parseInt = globalThis.parseInt;
function buildTimeValue(value) {
  const onlyDigitsValue = value.replace(/\D/g, "");
  if (onlyDigitsValue.length < 2) {
    return value;
  }
  const firstDigit = parseInt(onlyDigitsValue[0], 10);
  const secondDigit = parseInt(onlyDigitsValue[1], 10);
  if (firstDigit >= 3 || firstDigit === 2 && secondDigit >= 4) {
    let index;
    if (firstDigit >= 3) {
      index = 1;
    } else {
      index = 2;
    }
    return build(onlyDigitsValue, index);
  }
  if (value.length === 2) {
    return value;
  }
  return build(onlyDigitsValue, 2);
}
function build(onlyDigitsValue, index) {
  const hours = onlyDigitsValue.slice(0, index);
  const validHours = Math.min(parseInt(hours, 10), 23);
  const minuteCharacters = onlyDigitsValue.slice(index);
  const parsedMinutes = parseInt(minuteCharacters, 10);
  const validMinutes = Math.min(parsedMinutes, 59);
  return `${validHours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}`;
}

// src/utils/edit/isValidDateOrTimeValue.ts
function isValidDateOrTimeValue(element, value) {
  const clone = element.cloneNode();
  clone.value = value;
  return clone.value === value;
}

// src/utils/edit/maxLength.ts
var maxLengthSupportedTypes = /* @__PURE__ */ ((maxLengthSupportedTypes2) => {
  maxLengthSupportedTypes2["email"] = "email";
  maxLengthSupportedTypes2["password"] = "password";
  maxLengthSupportedTypes2["search"] = "search";
  maxLengthSupportedTypes2["telephone"] = "telephone";
  maxLengthSupportedTypes2["text"] = "text";
  maxLengthSupportedTypes2["url"] = "url";
  return maxLengthSupportedTypes2;
})(maxLengthSupportedTypes || {});
function getSpaceUntilMaxLength(element) {
  const value = getValue(element);
  if (value === null) {
    return void 0;
  }
  const maxLength = getSanitizedMaxLength(element);
  return maxLength ? maxLength - value.length : void 0;
}
function getSanitizedMaxLength(element) {
  var _a;
  if (!supportsMaxLength(element)) {
    return void 0;
  }
  const attr = (_a = element.getAttribute("maxlength")) != null ? _a : "";
  return /^\d+$/.test(attr) && Number(attr) >= 0 ? Number(attr) : void 0;
}
function supportsMaxLength(element) {
  return isElementType(element, "textarea") || isElementType(element, "input") && Boolean(maxLengthSupportedTypes[element.type]);
}

// src/utils/edit/input.ts
function isDateOrTime(element) {
  return isElementType(element, "input") && ["date", "time"].includes(element.type);
}
function input(config, element, data, inputType = "insertText") {
  const inputRange = getInputRange(element);
  if (!inputRange) {
    return;
  }
  if (!isDateOrTime(element)) {
    const unprevented = dispatchUIEvent(config, element, "beforeinput", {
      inputType,
      data
    });
    if (!unprevented) {
      return;
    }
  }
  if ("startContainer" in inputRange) {
    editContenteditable(config, element, inputRange, data, inputType);
  } else {
    editInputElement(config, element, inputRange, data, inputType);
  }
}
function editContenteditable(config, element, inputRange, data, inputType) {
  let del = false;
  if (!inputRange.collapsed) {
    del = true;
    inputRange.deleteContents();
  } else if (["deleteContentBackward", "deleteContentForward"].includes(inputType)) {
    const nextPosition = getNextCursorPosition(inputRange.startContainer, inputRange.startOffset, inputType === "deleteContentBackward" ? -1 : 1, inputType);
    if (nextPosition) {
      del = true;
      const delRange = inputRange.cloneRange();
      if (delRange.comparePoint(nextPosition.node, nextPosition.offset) < 0) {
        delRange.setStart(nextPosition.node, nextPosition.offset);
      } else {
        delRange.setEnd(nextPosition.node, nextPosition.offset);
      }
      delRange.deleteContents();
    }
  }
  if (data) {
    if (inputRange.endContainer.nodeType === 3) {
      const offset = inputRange.endOffset;
      inputRange.endContainer.insertData(offset, data);
      inputRange.setStart(inputRange.endContainer, offset + data.length);
      inputRange.setEnd(inputRange.endContainer, offset + data.length);
    } else {
      const text = element.ownerDocument.createTextNode(data);
      inputRange.insertNode(text);
      inputRange.setStart(text, data.length);
      inputRange.setEnd(text, data.length);
    }
  }
  if (del || data) {
    dispatchUIEvent(config, element, "input", { inputType });
  }
}
function editInputElement(config, element, inputRange, data, inputType) {
  let dataToInsert = data;
  const spaceUntilMaxLength = getSpaceUntilMaxLength(element);
  if (spaceUntilMaxLength !== void 0 && data.length > 0) {
    if (spaceUntilMaxLength > 0) {
      dataToInsert = data.substring(0, spaceUntilMaxLength);
    } else {
      return;
    }
  }
  const { newValue, newOffset, oldValue } = calculateNewValue(dataToInsert, element, inputRange, inputType);
  if (newValue === oldValue && newOffset === inputRange.startOffset && newOffset === inputRange.endOffset) {
    return;
  }
  if (isElementType(element, "input", { type: "number" }) && !isValidNumberInput(newValue)) {
    return;
  }
  setUIValue(element, newValue);
  setSelection({
    focusNode: element,
    anchorOffset: newOffset,
    focusOffset: newOffset
  });
  if (isDateOrTime(element)) {
    if (isValidDateOrTimeValue(element, newValue)) {
      commitInput(config, element, newOffset, {});
      dispatchUIEvent(config, element, "change");
      clearInitialValue(element);
    }
  } else {
    commitInput(config, element, newOffset, {
      data,
      inputType
    });
  }
}
function calculateNewValue(inputData, node, {
  startOffset,
  endOffset
}, inputType) {
  const value = getUIValue(node);
  const prologEnd = Math.max(0, startOffset === endOffset && inputType === "deleteContentBackward" ? startOffset - 1 : startOffset);
  const prolog = value.substring(0, prologEnd);
  const epilogStart = Math.min(value.length, startOffset === endOffset && inputType === "deleteContentForward" ? startOffset + 1 : endOffset);
  const epilog = value.substring(epilogStart, value.length);
  let newValue = `${prolog}${inputData}${epilog}`;
  let newOffset = prologEnd + inputData.length;
  if (isElementType(node, "input", { type: "time" })) {
    const builtValue = buildTimeValue(newValue);
    if (builtValue !== "" && isValidDateOrTimeValue(node, builtValue)) {
      newValue = builtValue;
      newOffset = builtValue.length;
    }
  }
  return {
    oldValue: value,
    newValue,
    newOffset
  };
}
function commitInput(config, element, newOffset, inputInit) {
  startTrackValue(element);
  dispatchUIEvent(config, element, "input", inputInit);
  if (endTrackValue(element)) {
    setSelection({
      focusNode: element,
      anchorOffset: newOffset,
      focusOffset: newOffset
    });
  }
}
function isValidNumberInput(value) {
  var _a, _b;
  const valueParts = value.split("e", 2);
  return !(/[^\d.\-e]/.test(value) || Number((_a = value.match(/-/g)) == null ? void 0 : _a.length) > 2 || Number((_b = value.match(/\./g)) == null ? void 0 : _b.length) > 1 || valueParts[1] && !/^-?\d*$/.test(valueParts[1]));
}

// src/utils/edit/isEditable.ts
function isEditable(element) {
  return isEditableInput(element) || isElementType(element, "textarea", { readOnly: false }) || isContentEditable(element);
}
var editableInputTypes = /* @__PURE__ */ ((editableInputTypes2) => {
  editableInputTypes2["text"] = "text";
  editableInputTypes2["date"] = "date";
  editableInputTypes2["datetime-local"] = "datetime-local";
  editableInputTypes2["email"] = "email";
  editableInputTypes2["month"] = "month";
  editableInputTypes2["number"] = "number";
  editableInputTypes2["password"] = "password";
  editableInputTypes2["search"] = "search";
  editableInputTypes2["tel"] = "tel";
  editableInputTypes2["time"] = "time";
  editableInputTypes2["url"] = "url";
  editableInputTypes2["week"] = "week";
  return editableInputTypes2;
})(editableInputTypes || {});
function isEditableInput(element) {
  return isElementType(element, "input", { readOnly: false }) && Boolean(editableInputTypes[element.type]);
}

// src/utils/edit/setFiles.ts
var fakeFiles = Symbol("files and value properties are mocked");
function setFiles(el, files) {
  var _a;
  (_a = el[fakeFiles]) == null ? void 0 : _a.restore();
  const objectDescriptors = Object.getOwnPropertyDescriptors(el);
  const prototypeDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(el));
  function restore() {
    Object.defineProperties(el, {
      files: __spreadValues(__spreadValues({}, prototypeDescriptors.files), objectDescriptors.files),
      value: __spreadValues(__spreadValues({}, prototypeDescriptors.value), objectDescriptors.value),
      type: __spreadValues(__spreadValues({}, prototypeDescriptors.type), objectDescriptors.type)
    });
  }
  el[fakeFiles] = { restore };
  Object.defineProperties(el, {
    files: __spreadProps(__spreadValues(__spreadValues({}, prototypeDescriptors.files), objectDescriptors.files), {
      get: () => files
    }),
    value: __spreadProps(__spreadValues(__spreadValues({}, prototypeDescriptors.value), objectDescriptors.value), {
      get: () => files.length ? `C:\\fakepath\\${files[0].name}` : "",
      set(v) {
        var _a2;
        if (v === "") {
          restore();
        } else {
          (_a2 = objectDescriptors.value.set) == null ? void 0 : _a2.call(el, v);
        }
      }
    }),
    type: __spreadProps(__spreadValues(__spreadValues({}, prototypeDescriptors.type), objectDescriptors.type), {
      set(v) {
        if (v !== "file") {
          restore();
          el.type = v;
        }
      }
    })
  });
}

// src/utils/misc/eventWrapper.ts
import { getConfig } from "@testing-library/dom";
function eventWrapper(cb) {
  let result;
  getConfig().eventWrapper(() => {
    result = cb();
  });
  return result;
}

// src/utils/misc/isDisabled.ts
function isDisabled(element) {
  var _a;
  for (let el = element; el; el = el.parentElement) {
    if (isElementType(el, [
      "button",
      "input",
      "select",
      "textarea",
      "optgroup",
      "option"
    ])) {
      if (el.hasAttribute("disabled")) {
        return true;
      }
    } else if (isElementType(el, "fieldset")) {
      if (el.hasAttribute("disabled") && !((_a = el.querySelector(":scope > legend")) == null ? void 0 : _a.contains(element))) {
        return true;
      }
    } else if (el.tagName.includes("-")) {
      if (el.constructor.formAssociated && el.hasAttribute("disabled")) {
        return true;
      }
    }
  }
  return false;
}

// src/utils/focus/getActiveElement.ts
function getActiveElement(document) {
  const activeElement = document.activeElement;
  if (activeElement == null ? void 0 : activeElement.shadowRoot) {
    return getActiveElement(activeElement.shadowRoot);
  } else {
    if (isDisabled(activeElement)) {
      return document.ownerDocument ? document.ownerDocument.body : document.body;
    }
    return activeElement;
  }
}

// src/utils/focus/selector.ts
var FOCUSABLE_SELECTOR = [
  "input:not([type=hidden]):not([disabled])",
  "button:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[contenteditable=""]',
  '[contenteditable="true"]',
  "a[href]",
  "[tabindex]:not([disabled])"
].join(", ");

// src/utils/focus/isFocusable.ts
function isFocusable(element) {
  return element.matches(FOCUSABLE_SELECTOR);
}

// src/utils/focus/blur.ts
function blur(element) {
  if (!isFocusable(element))
    return;
  const wasActive = getActiveElement(element.ownerDocument) === element;
  if (!wasActive)
    return;
  eventWrapper(() => element.blur());
}

// src/utils/focus/cursor.ts
function getNextCursorPosition(node, offset, direction, inputType) {
  if (isTextNode(node) && offset + direction >= 0 && offset + direction <= node.nodeValue.length) {
    return { node, offset: offset + direction };
  }
  const nextNode = getNextCharacterContentNode(node, offset, direction);
  if (nextNode) {
    if (isTextNode(nextNode)) {
      return {
        node: nextNode,
        offset: direction > 0 ? Math.min(1, nextNode.nodeValue.length) : Math.max(nextNode.nodeValue.length - 1, 0)
      };
    } else if (isElementType(nextNode, "br")) {
      const nextPlusOne = getNextCharacterContentNode(nextNode, void 0, direction);
      if (!nextPlusOne) {
        if (direction < 0 && inputType === "deleteContentBackward") {
          return {
            node: nextNode.parentNode,
            offset: getOffset(nextNode)
          };
        }
        return void 0;
      } else if (isTextNode(nextPlusOne)) {
        return {
          node: nextPlusOne,
          offset: direction > 0 ? 0 : nextPlusOne.nodeValue.length
        };
      } else if (direction < 0 && isElementType(nextPlusOne, "br")) {
        return {
          node: nextNode.parentNode,
          offset: getOffset(nextNode)
        };
      } else {
        return {
          node: nextPlusOne.parentNode,
          offset: getOffset(nextPlusOne) + (direction > 0 ? 0 : 1)
        };
      }
    } else {
      return {
        node: nextNode.parentNode,
        offset: getOffset(nextNode) + (direction > 0 ? 1 : 0)
      };
    }
  }
}
function getNextCharacterContentNode(node, offset, direction) {
  const nextOffset = Number(offset) + (direction < 0 ? -1 : 0);
  if (offset !== void 0 && isElement(node) && nextOffset >= 0 && nextOffset < node.children.length) {
    node = node.children[nextOffset];
  }
  return walkNodes(node, direction === 1 ? "next" : "previous", isTreatedAsCharacterContent);
}
function isTreatedAsCharacterContent(node) {
  if (isTextNode(node)) {
    return true;
  }
  if (isElement(node)) {
    if (isElementType(node, ["input", "textarea"])) {
      return node.type !== "hidden";
    } else if (isElementType(node, "br")) {
      return true;
    }
  }
  return false;
}
function getOffset(node) {
  let i = 0;
  while (node.previousSibling) {
    i++;
    node = node.previousSibling;
  }
  return i;
}
function isElement(node) {
  return node.nodeType === 1;
}
function isTextNode(node) {
  return node.nodeType === 3;
}
function walkNodes(node, direction, callback) {
  var _a;
  for (; ; ) {
    const sibling = node[`${direction}Sibling`];
    if (sibling) {
      node = getDescendant(sibling, direction === "next" ? "first" : "last");
      if (callback(node)) {
        return node;
      }
    } else if (node.parentNode && (!isElement(node.parentNode) || !isContentEditable(node.parentNode) && node.parentNode !== ((_a = node.ownerDocument) == null ? void 0 : _a.body))) {
      node = node.parentNode;
    } else {
      break;
    }
  }
}
function getDescendant(node, direction) {
  while (node.hasChildNodes()) {
    node = node[`${direction}Child`];
  }
  return node;
}

// src/utils/focus/selection.ts
function setSelectionRange(element, anchorOffset, focusOffset) {
  var _a;
  if (hasOwnSelection(element)) {
    return setSelection({
      focusNode: element,
      anchorOffset,
      focusOffset
    });
  }
  if (isContentEditable(element) && ((_a = element.firstChild) == null ? void 0 : _a.nodeType) === 3) {
    return setSelection({
      focusNode: element.firstChild,
      anchorOffset,
      focusOffset
    });
  }
  throw new Error("Not implemented. The result of this interaction is unreliable.");
}
function hasOwnSelection(node) {
  return isElement2(node) && (isElementType(node, "textarea") || isElementType(node, "input") && node.type in editableInputTypes);
}
function isElement2(node) {
  return node.nodeType === 1;
}
function getTargetTypeAndSelection(node) {
  const element = getElement2(node);
  if (element && hasOwnSelection(element)) {
    return {
      type: "input",
      selection: getUISelection(element)
    };
  }
  const selection = element == null ? void 0 : element.ownerDocument.getSelection();
  const isCE = getContentEditable(node) && (selection == null ? void 0 : selection.anchorNode) && getContentEditable(selection.anchorNode);
  return {
    type: isCE ? "contenteditable" : "default",
    selection
  };
}
function getElement2(node) {
  return node.nodeType === 1 ? node : node.parentElement;
}
function updateSelectionOnFocus(element) {
  var _a;
  const selection = element.ownerDocument.getSelection();
  if (!(selection == null ? void 0 : selection.focusNode)) {
    return;
  }
  if (hasOwnSelection(element)) {
    const contenteditable = getContentEditable(selection.focusNode);
    if (contenteditable) {
      if (!selection.isCollapsed) {
        const focusNode = ((_a = contenteditable.firstChild) == null ? void 0 : _a.nodeType) === 3 ? contenteditable.firstChild : contenteditable;
        selection.setBaseAndExtent(focusNode, 0, focusNode, 0);
      }
    } else {
      selection.setBaseAndExtent(element, 0, element, 0);
    }
  }
}
function getInputRange(focusNode) {
  var _a;
  const typeAndSelection = getTargetTypeAndSelection(focusNode);
  if (typeAndSelection.type === "input") {
    return typeAndSelection.selection;
  } else if (typeAndSelection.type === "contenteditable") {
    return (_a = typeAndSelection.selection) == null ? void 0 : _a.getRangeAt(0);
  }
}
function setSelection({
  focusNode,
  focusOffset,
  anchorNode = focusNode,
  anchorOffset = focusOffset
}) {
  var _a, _b;
  const typeAndSelection = getTargetTypeAndSelection(focusNode);
  if (typeAndSelection.type === "input") {
    return setUISelection(focusNode, {
      anchorOffset,
      focusOffset
    });
  }
  (_b = (_a = anchorNode.ownerDocument) == null ? void 0 : _a.getSelection()) == null ? void 0 : _b.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
}
function moveSelection(node, direction) {
  if (hasOwnSelection(node)) {
    const selection = getUISelection(node);
    setSelection({
      focusNode: node,
      focusOffset: selection.startOffset === selection.endOffset ? selection.focusOffset + direction : direction < 0 ? selection.startOffset : selection.endOffset
    });
  } else {
    const selection = node.ownerDocument.getSelection();
    if (!(selection == null ? void 0 : selection.focusNode)) {
      return;
    }
    if (selection.isCollapsed) {
      const nextPosition = getNextCursorPosition(selection.focusNode, selection.focusOffset, direction);
      if (nextPosition) {
        setSelection({
          focusNode: nextPosition.node,
          focusOffset: nextPosition.offset
        });
      }
    } else {
      selection[direction < 0 ? "collapseToStart" : "collapseToEnd"]();
    }
  }
}

// src/utils/focus/copySelection.ts
function copySelection(target) {
  const data = hasOwnSelection(target) ? { "text/plain": readSelectedValueFromInput(target) } : { "text/plain": String(target.ownerDocument.getSelection()) };
  const dt = createDataTransfer(getWindow(target));
  for (const type3 in data) {
    if (data[type3]) {
      dt.setData(type3, data[type3]);
    }
  }
  return dt;
}
function readSelectedValueFromInput(target) {
  const sel = getUISelection(target);
  const val = getUIValue(target);
  return val.substring(sel.startOffset, sel.endOffset);
}

// src/utils/misc/findClosest.ts
function findClosest(element, callback) {
  let el = element;
  do {
    if (callback(el)) {
      return el;
    }
    el = el.parentElement;
  } while (el && el !== element.ownerDocument.body);
  return void 0;
}

// src/utils/focus/focus.ts
function focus(element) {
  const target = findClosest(element, isFocusable);
  const activeElement = getActiveElement(element.ownerDocument);
  if ((target != null ? target : element.ownerDocument.body) === activeElement) {
    return;
  } else if (target) {
    eventWrapper(() => target.focus());
  } else {
    eventWrapper(() => activeElement == null ? void 0 : activeElement.blur());
  }
  updateSelectionOnFocus(target != null ? target : element.ownerDocument.body);
}

// src/utils/misc/isVisible.ts
function isVisible(element) {
  const window = getWindow(element);
  for (let el = element; el == null ? void 0 : el.ownerDocument; el = el.parentElement) {
    const { display, visibility } = window.getComputedStyle(el);
    if (display === "none") {
      return false;
    }
    if (visibility === "hidden") {
      return false;
    }
  }
  return true;
}

// src/utils/focus/getTabDestination.ts
function getTabDestination(activeElement, shift) {
  const document = activeElement.ownerDocument;
  const focusableElements = document.querySelectorAll(FOCUSABLE_SELECTOR);
  const enabledElements = Array.from(focusableElements).filter((el) => el === activeElement || !(Number(el.getAttribute("tabindex")) < 0 || isDisabled(el)));
  if (Number(activeElement.getAttribute("tabindex")) >= 0) {
    enabledElements.sort((a, b) => {
      const i = Number(a.getAttribute("tabindex"));
      const j = Number(b.getAttribute("tabindex"));
      if (i === j) {
        return 0;
      } else if (i === 0) {
        return 1;
      } else if (j === 0) {
        return -1;
      }
      return i - j;
    });
  }
  const checkedRadio = {};
  let prunedElements = [document.body];
  const activeRadioGroup = isElementType(activeElement, "input", {
    type: "radio"
  }) ? activeElement.name : void 0;
  enabledElements.forEach((currentElement) => {
    const el = currentElement;
    if (isElementType(el, "input", { type: "radio" }) && el.name) {
      if (el === activeElement) {
        prunedElements.push(el);
        return;
      } else if (el.name === activeRadioGroup) {
        return;
      }
      if (el.checked) {
        prunedElements = prunedElements.filter((e) => !isElementType(e, "input", { type: "radio", name: el.name }));
        prunedElements.push(el);
        checkedRadio[el.name] = el;
        return;
      }
      if (typeof checkedRadio[el.name] !== "undefined") {
        return;
      }
    }
    prunedElements.push(el);
  });
  for (let index = prunedElements.findIndex((el) => el === activeElement); ; ) {
    index += shift ? -1 : 1;
    if (index === prunedElements.length) {
      index = 0;
    } else if (index === -1) {
      index = prunedElements.length - 1;
    }
    if (prunedElements[index] === activeElement || prunedElements[index] === document.body || isVisible(prunedElements[index])) {
      return prunedElements[index];
    }
  }
}

// src/utils/focus/selectAll.ts
function selectAll(target) {
  var _a;
  if (isElementType(target, "textarea") || isElementType(target, "input") && target.type in editableInputTypes) {
    return setSelection({
      focusNode: target,
      anchorOffset: 0,
      focusOffset: getUIValue(target).length
    });
  }
  const focusNode = (_a = getContentEditable(target)) != null ? _a : target.ownerDocument.body;
  setSelection({
    focusNode,
    anchorOffset: 0,
    focusOffset: focusNode.childNodes.length
  });
}
function isAllSelected(target) {
  var _a;
  if (isElementType(target, "textarea") || isElementType(target, "input") && target.type in editableInputTypes) {
    return getUISelection(target).startOffset === 0 && getUISelection(target).endOffset === getUIValue(target).length;
  }
  const focusNode = (_a = getContentEditable(target)) != null ? _a : target.ownerDocument.body;
  const selection = target.ownerDocument.getSelection();
  return (selection == null ? void 0 : selection.anchorNode) === focusNode && selection.focusNode === focusNode && selection.anchorOffset === 0 && selection.focusOffset === focusNode.childNodes.length;
}

// src/utils/keyboard/getKeyEventProps.ts
function getKeyEventProps(keyDef) {
  return {
    key: keyDef.key,
    code: keyDef.code
  };
}

// src/utils/keyboard/getUIEventModifiers.ts
function getUIEventModifiers(keyboardState) {
  return {
    altKey: keyboardState.modifiers.Alt,
    ctrlKey: keyboardState.modifiers.Control,
    metaKey: keyboardState.modifiers.Meta,
    shiftKey: keyboardState.modifiers.Shift,
    modifierAltGraph: keyboardState.modifiers.AltGraph,
    modifierCapsLock: keyboardState.modifiers.CapsLock,
    modifierFn: keyboardState.modifiers.Fn,
    modifierFnLock: keyboardState.modifiers.FnLock,
    modifierNumLock: keyboardState.modifiers.NumLock,
    modifierScrollLock: keyboardState.modifiers.ScrollLock,
    modifierSymbol: keyboardState.modifiers.Symbol,
    modifierSymbolLock: keyboardState.modifiers.SymbolLock
  };
}

// src/utils/keyDef/readNextDescriptor.ts
var bracketDict = /* @__PURE__ */ ((bracketDict2) => {
  bracketDict2["{"] = "}";
  bracketDict2["["] = "]";
  return bracketDict2;
})(bracketDict || {});
function readNextDescriptor(text, context) {
  let pos = 0;
  const startBracket = text[pos] in bracketDict ? text[pos] : "";
  pos += startBracket.length;
  const isEscapedChar = new RegExp(`^\\${startBracket}{2}`).test(text);
  const type3 = isEscapedChar ? "" : startBracket;
  return __spreadValues({
    type: type3
  }, type3 === "" ? readPrintableChar(text, pos, context) : readTag(text, pos, type3, context));
}
function readPrintableChar(text, pos, context) {
  const descriptor = text[pos];
  assertDescriptor(descriptor, text, pos, context);
  pos += descriptor.length;
  return {
    consumedLength: pos,
    descriptor,
    releasePrevious: false,
    releaseSelf: true,
    repeat: 1
  };
}
function readTag(text, pos, startBracket, context) {
  var _a, _b, _c;
  const releasePreviousModifier = text[pos] === "/" ? "/" : "";
  pos += releasePreviousModifier.length;
  const escapedDescriptor = startBracket === "{" && text[pos] === "\\";
  pos += Number(escapedDescriptor);
  const descriptor = escapedDescriptor ? text[pos] : (_a = text.slice(pos).match(startBracket === "{" ? /^\w+|^[^}>/]/ : /^\w+/)) == null ? void 0 : _a[0];
  assertDescriptor(descriptor, text, pos, context);
  pos += descriptor.length;
  const repeatModifier = (_c = (_b = text.slice(pos).match(/^>\d+/)) == null ? void 0 : _b[0]) != null ? _c : "";
  pos += repeatModifier.length;
  const releaseSelfModifier = text[pos] === "/" || !repeatModifier && text[pos] === ">" ? text[pos] : "";
  pos += releaseSelfModifier.length;
  const expectedEndBracket = bracketDict[startBracket];
  const endBracket = text[pos] === expectedEndBracket ? expectedEndBracket : "";
  if (!endBracket) {
    throw new Error(getErrorMessage([
      !repeatModifier && "repeat modifier",
      !releaseSelfModifier && "release modifier",
      `"${expectedEndBracket}"`
    ].filter(Boolean).join(" or "), text[pos], text, context));
  }
  pos += endBracket.length;
  return {
    consumedLength: pos,
    descriptor,
    releasePrevious: !!releasePreviousModifier,
    repeat: repeatModifier ? Math.max(Number(repeatModifier.substr(1)), 1) : 1,
    releaseSelf: hasReleaseSelf(releaseSelfModifier, repeatModifier)
  };
}
function assertDescriptor(descriptor, text, pos, context) {
  if (!descriptor) {
    throw new Error(getErrorMessage("key descriptor", text[pos], text, context));
  }
}
function hasReleaseSelf(releaseSelfModifier, repeatModifier) {
  if (releaseSelfModifier) {
    return releaseSelfModifier === "/";
  }
  if (repeatModifier) {
    return false;
  }
}
function getErrorMessage(expected, found, text, context) {
  return `Expected ${expected} but found "${found != null ? found : ""}" in "${text}"
    See ${context === "pointer" ? `https://testing-library.com/docs/user-event/pointer#pressing-a-button-or-touching-the-screen` : `https://testing-library.com/docs/user-event/keyboard`}
    for more information about how userEvent parses your input.`;
}

// src/utils/misc/cloneEvent.ts
function cloneEvent(event) {
  return new event.constructor(event.type, event);
}

// src/utils/misc/getDocumentFromNode.ts
function getDocumentFromNode(el) {
  return isDocument(el) ? el : el.ownerDocument;
}
function isDocument(node) {
  return node.nodeType === 9;
}

// src/utils/misc/isDescendantOrSelf.ts
function isDescendantOrSelf(potentialDescendant, potentialAncestor) {
  let el = potentialDescendant;
  do {
    if (el === potentialAncestor) {
      return true;
    }
    el = el.parentElement;
  } while (el);
  return false;
}

// src/utils/misc/level.ts
var Level = Symbol("Api level refs");
function setLevelRef(config, level) {
  var _a;
  (_a = config[Level]) != null ? _a : config[Level] = {};
  config[Level][level] = {};
}
function getLevelRef(config, level) {
  var _a;
  return (_a = config[Level]) == null ? void 0 : _a[level];
}

// src/utils/misc/wait.ts
function wait(config) {
  const delay = config.delay;
  if (typeof delay !== "number") {
    return;
  }
  return Promise.all([
    new Promise((resolve) => globalThis.setTimeout(() => resolve(), delay)),
    config.advanceTimers(delay)
  ]);
}

// src/keyboard/keyMap.ts
var defaultKeyMap = [
  ..."0123456789".split("").map((c) => ({ code: `Digit${c}`, key: c })),
  ...")!@#$%^&*(".split("").map((c, i) => ({ code: `Digit${i}`, key: c, shiftKey: true })),
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((c) => ({ code: `Key${c.toUpperCase()}`, key: c })),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({ code: `Key${c}`, key: c, shiftKey: true })),
  { code: "Space", key: " " },
  { code: "AltLeft", key: "Alt", location: 1 /* LEFT */ },
  { code: "AltRight", key: "Alt", location: 2 /* RIGHT */ },
  {
    code: "ShiftLeft",
    key: "Shift",
    location: 1 /* LEFT */
  },
  {
    code: "ShiftRight",
    key: "Shift",
    location: 2 /* RIGHT */
  },
  {
    code: "ControlLeft",
    key: "Control",
    location: 1 /* LEFT */
  },
  {
    code: "ControlRight",
    key: "Control",
    location: 2 /* RIGHT */
  },
  { code: "MetaLeft", key: "Meta", location: 1 /* LEFT */ },
  {
    code: "MetaRight",
    key: "Meta",
    location: 2 /* RIGHT */
  },
  { code: "OSLeft", key: "OS", location: 1 /* LEFT */ },
  { code: "OSRight", key: "OS", location: 2 /* RIGHT */ },
  { code: "Tab", key: "Tab" },
  { code: "CapsLock", key: "CapsLock" },
  { code: "Backspace", key: "Backspace" },
  { code: "Enter", key: "Enter" },
  { code: "Escape", key: "Escape" },
  { code: "ArrowUp", key: "ArrowUp" },
  { code: "ArrowDown", key: "ArrowDown" },
  { code: "ArrowLeft", key: "ArrowLeft" },
  { code: "ArrowRight", key: "ArrowRight" },
  { code: "Home", key: "Home" },
  { code: "End", key: "End" },
  { code: "Delete", key: "Delete" },
  { code: "PageUp", key: "PageUp" },
  { code: "PageDown", key: "PageDown" },
  { code: "Fn", key: "Fn" },
  { code: "Symbol", key: "Symbol" },
  { code: "AltRight", key: "AltGraph" }
];

// src/pointer/keyMap.ts
var defaultKeyMap2 = [
  { name: "MouseLeft", pointerType: "mouse", button: "primary" },
  { name: "MouseRight", pointerType: "mouse", button: "secondary" },
  { name: "MouseMiddle", pointerType: "mouse", button: "auxiliary" },
  { name: "TouchA", pointerType: "touch" },
  { name: "TouchB", pointerType: "touch" },
  { name: "TouchC", pointerType: "touch" }
];

// src/options.ts
var PointerEventsCheckLevel = /* @__PURE__ */ ((PointerEventsCheckLevel2) => {
  PointerEventsCheckLevel2[PointerEventsCheckLevel2["EachTrigger"] = 4] = "EachTrigger";
  PointerEventsCheckLevel2[PointerEventsCheckLevel2["EachApiCall"] = 2] = "EachApiCall";
  PointerEventsCheckLevel2[PointerEventsCheckLevel2["EachTarget"] = 1] = "EachTarget";
  PointerEventsCheckLevel2[PointerEventsCheckLevel2["Never"] = 0] = "Never";
  return PointerEventsCheckLevel2;
})(PointerEventsCheckLevel || {});
var defaultOptionsDirect = {
  applyAccept: true,
  autoModify: true,
  delay: 0,
  document: globalThis.document,
  keyboardMap: defaultKeyMap,
  pointerMap: defaultKeyMap2,
  pointerEventsCheck: 2 /* EachApiCall */,
  skipAutoClose: false,
  skipClick: false,
  skipHover: false,
  writeToClipboard: false,
  advanceTimers: () => Promise.resolve()
};
var defaultOptionsSetup = __spreadProps(__spreadValues({}, defaultOptionsDirect), {
  writeToClipboard: true
});

// src/utils/pointer/cssPointerEvents.ts
function hasPointerEvents(element) {
  var _a;
  return ((_a = closestPointerEventsDeclaration(element)) == null ? void 0 : _a.pointerEvents) !== "none";
}
function closestPointerEventsDeclaration(element) {
  const window = getWindow(element);
  for (let el = element, tree = []; el == null ? void 0 : el.ownerDocument; el = el.parentElement) {
    tree.push(el);
    const pointerEvents = window.getComputedStyle(el).pointerEvents;
    if (pointerEvents && !["inherit", "unset"].includes(pointerEvents)) {
      return { pointerEvents, tree };
    }
  }
  return void 0;
}
var PointerEventsCheck = Symbol("Last check for pointer-events");
function assertPointerEvents(config, element) {
  const lastCheck = element[PointerEventsCheck];
  const needsCheck = config.pointerEventsCheck !== 0 /* Never */ && (!lastCheck || hasBitFlag(config.pointerEventsCheck, 2 /* EachApiCall */) && lastCheck[1 /* Call */] !== getLevelRef(config, 1 /* Call */) || hasBitFlag(config.pointerEventsCheck, 4 /* EachTrigger */) && lastCheck[2 /* Trigger */] !== getLevelRef(config, 2 /* Trigger */));
  if (!needsCheck) {
    return;
  }
  const declaration = closestPointerEventsDeclaration(element);
  element[PointerEventsCheck] = {
    [1 /* Call */]: getLevelRef(config, 1 /* Call */),
    [2 /* Trigger */]: getLevelRef(config, 2 /* Trigger */),
    result: (declaration == null ? void 0 : declaration.pointerEvents) !== "none"
  };
  if ((declaration == null ? void 0 : declaration.pointerEvents) === "none") {
    throw new Error([
      `Unable to perform pointer interaction as the element ${declaration.tree.length > 1 ? "inherits" : "has"} \`pointer-events: none\`:`,
      "",
      printTree(declaration.tree)
    ].join("\n"));
  }
}
function printTree(tree) {
  return tree.reverse().map((el, i) => [
    "".padEnd(i),
    el.tagName,
    el.id && `#${el.id}`,
    el.hasAttribute("data-testid") && `(testId=${el.getAttribute("data-testid")})`,
    getLabelDescr(el),
    tree.length > 1 && i === 0 && "  <-- This element declared `pointer-events: none`",
    tree.length > 1 && i === tree.length - 1 && "  <-- Asserted pointer events here"
  ].filter(Boolean).join("")).join("\n");
}
function getLabelDescr(element) {
  var _a, _b, _c, _d;
  let label;
  if (element.hasAttribute("aria-label")) {
    label = element.getAttribute("aria-label");
  } else if (element.hasAttribute("aria-labelledby")) {
    label = (_b = (_a = element.ownerDocument.getElementById(element.getAttribute("aria-labelledby"))) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
  } else if (isElementType(element, [
    "button",
    "input",
    "meter",
    "output",
    "progress",
    "select",
    "textarea"
  ]) && ((_c = element.labels) == null ? void 0 : _c.length)) {
    label = Array.from(element.labels).map((el) => {
      var _a2;
      return (_a2 = el.textContent) == null ? void 0 : _a2.trim();
    }).join("|");
  } else if (isElementType(element, "button")) {
    label = (_d = element.textContent) == null ? void 0 : _d.trim();
  }
  label = label == null ? void 0 : label.replace(/\n/g, "  ");
  if (Number(label == null ? void 0 : label.length) > 30) {
    label = `${label == null ? void 0 : label.substring(0, 29)}\u2026`;
  }
  return label ? `(label=${label})` : "";
}
function hasBitFlag(conf, flag) {
  return (conf & flag) > 0;
}

// src/utils/pointer/mouseButtons.ts
var MouseButton = {
  primary: 0,
  secondary: 1,
  auxiliary: 2,
  back: 3,
  X1: 3,
  forward: 4,
  X2: 4
};
var MouseButtonFlip = {
  auxiliary: 1,
  secondary: 2,
  1: 2,
  2: 1
};
function getMouseButton(button) {
  if (button in MouseButtonFlip) {
    return MouseButtonFlip[button];
  }
  return typeof button === "number" ? button : MouseButton[button];
}
function getMouseButtons(...buttons) {
  let v = 0;
  for (const t of buttons) {
    const pos = typeof t === "number" ? t : MouseButton[t];
    v |= __pow(2, pos);
  }
  return v;
}

// src/event/createEvent.ts
import { createEvent as createEventBase } from "@testing-library/dom";

// src/event/eventMap.ts
import { eventMap as baseEventMap } from "@testing-library/dom/dist/event-map.js";
var eventMap = __spreadProps(__spreadValues({}, baseEventMap), {
  beforeInput: {
    EventType: "InputEvent",
    defaultInit: { bubbles: true, cancelable: true, composed: true }
  }
});
var eventMapKeys = Object.fromEntries(Object.keys(eventMap).map((k) => [k.toLowerCase(), k]));

// src/event/eventTypes.ts
import { eventMap as eventMap2 } from "@testing-library/dom/dist/event-map.js";
var eventKeys = Object.fromEntries(Object.keys(eventMap2).map((k) => [k.toLowerCase(), k]));
function getEventClass(type3) {
  return type3 in eventKeys ? eventMap2[eventKeys[type3]].EventType : "Event";
}
var mouseEvents = ["MouseEvent", "PointerEvent"];
function isMouseEvent(type3) {
  return mouseEvents.includes(getEventClass(type3));
}
function isKeyboardEvent(type3) {
  return getEventClass(type3) === "KeyboardEvent";
}

// src/event/createEvent.ts
function createEvent(type3, target, init) {
  const event = createEventBase(type3, target, init, eventMap[eventMapKeys[type3]]);
  if (isMouseEvent(type3) && init) {
    assignPositionInit(event, init);
    assignPointerInit(event, init);
  }
  return event;
}
function assignProps(obj, props) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(obj, key, { get: () => value });
  }
}
function assignPositionInit(obj, {
  x,
  y,
  clientX,
  clientY,
  offsetX,
  offsetY,
  pageX,
  pageY,
  screenX,
  screenY
}) {
  var _a, _b, _c, _d;
  assignProps(obj, {
    x: (_a = x != null ? x : clientX) != null ? _a : 0,
    y: (_b = y != null ? y : clientY) != null ? _b : 0,
    clientX: (_c = x != null ? x : clientX) != null ? _c : 0,
    clientY: (_d = y != null ? y : clientY) != null ? _d : 0,
    offsetX: offsetX != null ? offsetX : 0,
    offsetY: offsetY != null ? offsetY : 0,
    pageX: pageX != null ? pageX : 0,
    pageY: pageY != null ? pageY : 0,
    screenX: screenX != null ? screenX : 0,
    screenY: screenY != null ? screenY : 0
  });
}
function assignPointerInit(obj, { isPrimary, pointerId, pointerType }) {
  assignProps(obj, {
    isPrimary,
    pointerId,
    pointerType
  });
}

// src/event/behavior/registry.ts
var behavior = {};

// src/event/behavior/click.ts
behavior.click = (event, target, config) => {
  const context = target.closest("button,input,label,select,textarea");
  const control = context && isElementType(context, "label") && context.control;
  if (control) {
    return () => {
      if (isFocusable(control)) {
        focus(control);
      }
      dispatchEvent(config, control, cloneEvent(event));
    };
  } else if (isElementType(target, "input", { type: "file" })) {
    return () => {
      blur(target);
      target.dispatchEvent(new (getWindow(target)).Event("fileDialog"));
      focus(target);
    };
  }
};

// src/event/behavior/cut.ts
behavior.cut = (event, target, config) => {
  return () => {
    if (isEditable(target)) {
      input(config, target, "", "deleteByCut");
    }
  };
};

// src/event/behavior/keydown.ts
behavior.keydown = (event, target, config) => {
  var _a, _b;
  return (_b = (_a = keydownBehavior[event.key]) == null ? void 0 : _a.call(keydownBehavior, event, target, config)) != null ? _b : combinationBehavior(event, target, config);
};
var keydownBehavior = {
  ArrowLeft: (event, target) => () => moveSelection(target, -1),
  ArrowRight: (event, target) => () => moveSelection(target, 1),
  Backspace: (event, target, config) => {
    if (isEditable(target)) {
      return () => {
        input(config, target, "", "deleteContentBackward");
      };
    }
  },
  Delete: (event, target, config) => {
    if (isEditable(target)) {
      return () => {
        input(config, target, "", "deleteContentForward");
      };
    }
  },
  End: (event, target) => {
    if (isElementType(target, ["input", "textarea"]) || isContentEditable(target)) {
      return () => {
        var _a, _b;
        const newPos = (_b = (_a = getValue(target)) == null ? void 0 : _a.length) != null ? _b : 0;
        setSelectionRange(target, newPos, newPos);
      };
    }
  },
  Home: (event, target) => {
    if (isElementType(target, ["input", "textarea"]) || isContentEditable(target)) {
      return () => {
        setSelectionRange(target, 0, 0);
      };
    }
  },
  PageDown: (event, target) => {
    if (isElementType(target, ["input"])) {
      return () => {
        const newPos = getValue(target).length;
        setSelectionRange(target, newPos, newPos);
      };
    }
  },
  PageUp: (event, target) => {
    if (isElementType(target, ["input"])) {
      return () => {
        setSelectionRange(target, 0, 0);
      };
    }
  },
  Tab: (event, target, { keyboardState }) => {
    return () => {
      const dest = getTabDestination(target, keyboardState.modifiers.Shift);
      focus(dest);
      if (hasOwnSelection(dest)) {
        setUISelection(dest, {
          anchorOffset: 0,
          focusOffset: dest.value.length
        });
      }
    };
  }
};
var combinationBehavior = (event, target, config) => {
  if (event.code === "KeyA" && config.keyboardState.modifiers.Control) {
    return () => selectAll(target);
  }
};

// src/event/behavior/keypress.ts
behavior.keypress = (event, target, config) => {
  if (event.key === "Enter") {
    if (isElementType(target, "button") || isElementType(target, "input") && ClickInputOnEnter.includes(target.type) || isElementType(target, "a") && Boolean(target.href)) {
      return () => {
        dispatchUIEvent(config, target, "click");
      };
    } else if (isElementType(target, "input")) {
      const form = target.form;
      const submit = form == null ? void 0 : form.querySelector('input[type="submit"], button:not([type]), button[type="submit"]');
      if (submit) {
        return () => dispatchUIEvent(config, submit, "click");
      } else if (form && SubmitSingleInputOnEnter.includes(target.type) && form.querySelectorAll("input").length === 1) {
        return () => dispatchUIEvent(config, form, "submit");
      } else {
        return;
      }
    }
  }
  if (isEditable(target)) {
    const inputType = event.key === "Enter" ? isContentEditable(target) && !config.keyboardState.modifiers.Shift ? "insertParagraph" : "insertLineBreak" : "insertText";
    const inputData = event.key === "Enter" ? "\n" : event.key;
    return () => input(config, target, inputData, inputType);
  }
};
var ClickInputOnEnter = [
  "button",
  "color",
  "file",
  "image",
  "reset",
  "submit"
];
var SubmitSingleInputOnEnter = [
  "email",
  "month",
  "password",
  "search",
  "tel",
  "text",
  "url",
  "week"
];

// src/event/behavior/keyup.ts
behavior.keyup = (event, target, config) => {
  var _a;
  return (_a = keyupBehavior[event.key]) == null ? void 0 : _a.call(keyupBehavior, event, target, config);
};
var keyupBehavior = {
  " ": (event, target, config) => {
    if (isClickableInput(target)) {
      return () => dispatchUIEvent(config, target, "click");
    }
  }
};

// src/event/behavior/paste.ts
behavior.paste = (event, target, config) => {
  if (isEditable(target)) {
    return () => {
      var _a;
      const insertData = (_a = event.clipboardData) == null ? void 0 : _a.getData("text");
      if (insertData) {
        input(config, target, insertData, "insertFromPaste");
      }
    };
  }
};

// src/event/wrapEvent.ts
import { getConfig as getConfig2 } from "@testing-library/dom";
function wrapEvent(cb, _element) {
  return getConfig2().eventWrapper(cb);
}

// src/event/dispatchEvent.ts
function dispatchEvent(config, target, event, preventDefault = false) {
  var _a, _b;
  const type3 = event.type;
  const behaviorImplementation = preventDefault ? () => {
  } : (_b = (_a = behavior)[type3]) == null ? void 0 : _b.call(_a, event, target, config);
  if (behaviorImplementation) {
    event.preventDefault();
    let defaultPrevented = false;
    Object.defineProperty(event, "defaultPrevented", {
      get: () => defaultPrevented
    });
    Object.defineProperty(event, "preventDefault", {
      value: () => {
        defaultPrevented = event.cancelable;
      }
    });
    wrapEvent(() => target.dispatchEvent(event), target);
    if (!defaultPrevented) {
      behaviorImplementation();
    }
    return !defaultPrevented;
  }
  return wrapEvent(() => target.dispatchEvent(event), target);
}

// src/event/index.ts
function dispatchUIEvent(config, target, type3, init, preventDefault = false) {
  if (isMouseEvent(type3) || isKeyboardEvent(type3)) {
    init = __spreadValues(__spreadValues({}, init), getUIEventModifiers(config.keyboardState));
  }
  const event = createEvent(type3, target, init);
  return dispatchEvent(config, target, event, preventDefault);
}
function bindDispatchUIEvent(config) {
  return dispatchUIEvent.bind(void 0, config);
}

// src/document/interceptor.ts
var Interceptor = Symbol("Interceptor for programmatical calls");
function prepareInterceptor(element, propName, interceptorImpl) {
  const prototypeDescriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, propName);
  const objectDescriptor = Object.getOwnPropertyDescriptor(element, propName);
  const target = (prototypeDescriptor == null ? void 0 : prototypeDescriptor.set) ? "set" : "value";
  if (typeof (prototypeDescriptor == null ? void 0 : prototypeDescriptor[target]) !== "function" || prototypeDescriptor[target][Interceptor]) {
    return;
  }
  function intercept(...args) {
    const {
      applyNative = true,
      realArgs,
      then
    } = interceptorImpl.call(this, ...args);
    const realFunc = (!applyNative && objectDescriptor || prototypeDescriptor)[target];
    if (target === "set") {
      realFunc.call(this, realArgs);
    } else {
      realFunc.call(this, ...realArgs);
    }
    then == null ? void 0 : then();
  }
  ;
  intercept[Interceptor] = Interceptor;
  Object.defineProperty(element, propName, __spreadProps(__spreadValues({}, objectDescriptor != null ? objectDescriptor : prototypeDescriptor), {
    [target]: intercept
  }));
}

// src/document/selection.ts
var UISelection = Symbol("Displayed selection in UI");
function prepareSelectionInterceptor(element) {
  prepareInterceptor(element, "setSelectionRange", function interceptorImpl(start, end, direction = "none") {
    const isUI = start && typeof start === "object" && start[UISelection];
    if (!isUI) {
      this[UISelection] = void 0;
    }
    return {
      realArgs: [Number(start), end, direction]
    };
  });
  prepareInterceptor(element, "selectionStart", function interceptorImpl(v) {
    this[UISelection] = void 0;
    return { realArgs: v };
  });
  prepareInterceptor(element, "selectionEnd", function interceptorImpl(v) {
    this[UISelection] = void 0;
    return { realArgs: v };
  });
  prepareInterceptor(element, "select", function interceptorImpl() {
    this[UISelection] = {
      anchorOffset: 0,
      focusOffset: getUIValue(element).length
    };
    return { realArgs: [] };
  });
}
function setUISelection(element, {
  focusOffset: focusOffsetParam,
  anchorOffset: anchorOffsetParam = focusOffsetParam
}, mode = "replace") {
  const valueLength = getUIValue(element).length;
  const sanitizeOffset = (o) => Math.max(0, Math.min(valueLength, o));
  const anchorOffset = mode === "replace" || element[UISelection] === void 0 ? sanitizeOffset(anchorOffsetParam) : element[UISelection].anchorOffset;
  const focusOffset = sanitizeOffset(focusOffsetParam);
  const startOffset = Math.min(anchorOffset, focusOffset);
  const endOffset = Math.max(anchorOffset, focusOffset);
  element[UISelection] = {
    anchorOffset,
    focusOffset
  };
  if (element.selectionStart === startOffset && element.selectionEnd === endOffset) {
    return;
  }
  const startObj = new Number(startOffset);
  startObj[UISelection] = UISelection;
  try {
    element.setSelectionRange(startObj, endOffset);
  } catch (e) {
  }
}
function getUISelection(element) {
  var _a, _b, _c;
  const sel = (_c = element[UISelection]) != null ? _c : {
    anchorOffset: (_a = element.selectionStart) != null ? _a : 0,
    focusOffset: (_b = element.selectionEnd) != null ? _b : 0
  };
  return __spreadProps(__spreadValues({}, sel), {
    startOffset: Math.min(sel.anchorOffset, sel.focusOffset),
    endOffset: Math.max(sel.anchorOffset, sel.focusOffset)
  });
}

// src/document/value.ts
var UIValue = Symbol("Displayed value in UI");
var InitialValue = Symbol("Initial value to compare on blur");
var TrackChanges = Symbol("Track programmatic changes for React workaround");
function valueInterceptor(v) {
  const isUI = typeof v === "object" && v[UIValue];
  if (isUI) {
    this[UIValue] = String(v);
    setPreviousValue(this, String(this.value));
  }
  return {
    applyNative: !!isUI,
    realArgs: sanitizeValue(this, v),
    then: isUI ? void 0 : () => trackOrSetValue(this, String(v))
  };
}
function sanitizeValue(element, v) {
  if (isElementType(element, "input", { type: "number" }) && String(v) !== "" && !Number.isNaN(Number(v))) {
    return String(Number(v));
  }
  return String(v);
}
function prepareValueInterceptor(element) {
  prepareInterceptor(element, "value", valueInterceptor);
}
function setUIValue(element, value) {
  if (element[InitialValue] === void 0) {
    element[InitialValue] = element.value;
  }
  element.value = {
    [UIValue]: UIValue,
    toString: () => value
  };
}
function getUIValue(element) {
  return element[UIValue] === void 0 ? element.value : String(element[UIValue]);
}
function clearInitialValue(element) {
  element[InitialValue] = void 0;
}
function getInitialValue(element) {
  return element[InitialValue];
}
function setPreviousValue(element, v) {
  element[TrackChanges] = __spreadProps(__spreadValues({}, element[TrackChanges]), { previousValue: v });
}
function startTrackValue(element) {
  element[TrackChanges] = __spreadProps(__spreadValues({}, element[TrackChanges]), {
    nextValue: String(element.value),
    tracked: []
  });
}
function trackOrSetValue(element, v) {
  var _a, _b, _c;
  (_b = (_a = element[TrackChanges]) == null ? void 0 : _a.tracked) == null ? void 0 : _b.push(v);
  if (!((_c = element[TrackChanges]) == null ? void 0 : _c.tracked)) {
    setCleanValue(element, v);
  }
}
function setCleanValue(element, v) {
  element[UIValue] = void 0;
  setUISelection(element, { focusOffset: v.length });
}
function endTrackValue(element) {
  var _a, _b;
  const changes = element[TrackChanges];
  element[TrackChanges] = void 0;
  const isJustReactStateUpdate = ((_a = changes == null ? void 0 : changes.tracked) == null ? void 0 : _a.length) === 2 && changes.tracked[0] === changes.previousValue && changes.tracked[1] === changes.nextValue;
  if (((_b = changes == null ? void 0 : changes.tracked) == null ? void 0 : _b.length) && !isJustReactStateUpdate) {
    setCleanValue(element, changes.tracked[changes.tracked.length - 1]);
  }
  return isJustReactStateUpdate;
}

// src/document/index.ts
var isPrepared = Symbol("Node prepared with document state workarounds");
function prepareDocument(document) {
  if (document[isPrepared]) {
    return;
  }
  document.addEventListener("focus", (e) => {
    const el = e.target;
    prepareElement(el);
  }, {
    capture: true,
    passive: true
  });
  if (document.activeElement) {
    prepareElement(document.activeElement);
  }
  document.addEventListener("blur", (e) => {
    const el = e.target;
    const initialValue = getInitialValue(el);
    if (initialValue !== void 0) {
      if (el.value !== initialValue) {
        dispatchUIEvent({}, el, "change");
      }
      clearInitialValue(el);
    }
  }, {
    capture: true,
    passive: true
  });
  document[isPrepared] = isPrepared;
}
function prepareElement(el) {
  if (el[isPrepared]) {
    return;
  }
  if ("value" in el) {
    prepareValueInterceptor(el);
    prepareSelectionInterceptor(el);
  }
  el[isPrepared] = isPrepared;
}

// src/keyboard/modifiers.ts
var modifierKeys = [
  "Alt",
  "AltGraph",
  "Control",
  "Fn",
  "Meta",
  "Shift",
  "Symbol"
];
function isModifierKey(key) {
  return modifierKeys.includes(key);
}
var modifierLocks = [
  "CapsLock",
  "FnLock",
  "NumLock",
  "ScrollLock",
  "SymbolLock"
];
function isModifierLock(key) {
  return modifierLocks.includes(key);
}
function preKeydownBehavior(config, { key }, element) {
  var _a;
  if (isModifierKey(key)) {
    config.keyboardState.modifiers[key] = true;
    if (key === "AltGraph") {
      const ctrlKeyDef = (_a = config.keyboardMap.find((k) => k.key === "Control")) != null ? _a : { key: "Control", code: "Control" };
      dispatchUIEvent(config, element, "keydown", getKeyEventProps(ctrlKeyDef));
    }
  } else if (isModifierLock(key)) {
    config.keyboardState.modifierPhase[key] = config.keyboardState.modifiers[key];
    if (!config.keyboardState.modifierPhase[key]) {
      config.keyboardState.modifiers[key] = true;
    }
  }
}
function preKeyupBehavior(config, { key }) {
  if (isModifierKey(key)) {
    config.keyboardState.modifiers[key] = false;
  } else if (isModifierLock(key)) {
    if (config.keyboardState.modifierPhase[key]) {
      config.keyboardState.modifiers[key] = false;
    }
  }
}
function postKeyupBehavior(config, { key }, element) {
  var _a;
  if (key === "AltGraph") {
    const ctrlKeyDef = (_a = config.keyboardMap.find((k) => k.key === "Control")) != null ? _a : { key: "Control", code: "Control" };
    dispatchUIEvent(config, element, "keyup", getKeyEventProps(ctrlKeyDef));
  }
}

// src/keyboard/keyboardAction.ts
function keyboardAction(config, actions) {
  return __async(this, null, function* () {
    for (let i = 0; i < actions.length; i++) {
      yield keyboardKeyAction(config, actions[i]);
      if (i < actions.length - 1) {
        yield wait(config);
      }
    }
  });
}
function keyboardKeyAction(_0, _1) {
  return __async(this, arguments, function* (config, { keyDef, releasePrevious, releaseSelf, repeat }) {
    const { document, keyboardState } = config;
    const getCurrentElement = () => getActive(document);
    const pressed = keyboardState.pressed.find((p) => p.keyDef === keyDef);
    if (pressed) {
      yield keyup(keyDef, getCurrentElement, config, pressed.unpreventedDefault);
    }
    if (!releasePrevious) {
      let unpreventedDefault = true;
      for (let i = 1; i <= repeat; i++) {
        unpreventedDefault = yield keydown(keyDef, getCurrentElement, config);
        if (unpreventedDefault && hasKeyPress(keyDef, config)) {
          yield keypress(keyDef, getCurrentElement, config);
        }
        if (i < repeat) {
          yield wait(config);
        }
      }
      if (releaseSelf) {
        yield keyup(keyDef, getCurrentElement, config, unpreventedDefault);
      }
    }
  });
}
function getActive(document) {
  var _a;
  return (_a = getActiveElement(document)) != null ? _a : document.body;
}
function releaseAllKeys(config) {
  return __async(this, null, function* () {
    const getCurrentElement = () => getActive(config.document);
    for (const k of config.keyboardState.pressed) {
      yield keyup(k.keyDef, getCurrentElement, config, k.unpreventedDefault);
    }
  });
}
function keydown(keyDef, getCurrentElement, config) {
  return __async(this, null, function* () {
    const element = getCurrentElement();
    if (element !== config.keyboardState.activeElement) {
      config.keyboardState.carryValue = void 0;
      config.keyboardState.carryChar = "";
    }
    config.keyboardState.activeElement = element;
    preKeydownBehavior(config, keyDef, element);
    const unpreventedDefault = dispatchUIEvent(config, element, "keydown", getKeyEventProps(keyDef));
    config.keyboardState.pressed.push({ keyDef, unpreventedDefault });
    return unpreventedDefault;
  });
}
function keypress(keyDef, getCurrentElement, config) {
  return __async(this, null, function* () {
    const element = getCurrentElement();
    dispatchUIEvent(config, element, "keypress", __spreadProps(__spreadValues({}, getKeyEventProps(keyDef)), {
      charCode: keyDef.key === "Enter" ? 13 : String(keyDef.key).charCodeAt(0)
    }));
  });
}
function keyup(keyDef, getCurrentElement, config, unprevented) {
  return __async(this, null, function* () {
    const element = getCurrentElement();
    preKeyupBehavior(config, keyDef);
    dispatchUIEvent(config, element, "keyup", getKeyEventProps(keyDef), !unprevented);
    config.keyboardState.pressed = config.keyboardState.pressed.filter((k) => k.keyDef !== keyDef);
    postKeyupBehavior(config, keyDef, element);
  });
}
function hasKeyPress(keyDef, config) {
  var _a;
  return (((_a = keyDef.key) == null ? void 0 : _a.length) === 1 || keyDef.key === "Enter") && !config.keyboardState.modifiers.Control && !config.keyboardState.modifiers.Alt;
}

// src/keyboard/parseKeyDef.ts
function parseKeyDef(keyboardMap, text) {
  var _a;
  const defs = [];
  do {
    const {
      type: type3,
      descriptor,
      consumedLength,
      releasePrevious,
      releaseSelf = true,
      repeat
    } = readNextDescriptor(text, "keyboard");
    const keyDef = (_a = keyboardMap.find((def) => {
      var _a2, _b;
      if (type3 === "[") {
        return ((_a2 = def.code) == null ? void 0 : _a2.toLowerCase()) === descriptor.toLowerCase();
      } else if (type3 === "{") {
        return ((_b = def.key) == null ? void 0 : _b.toLowerCase()) === descriptor.toLowerCase();
      }
      return def.key === descriptor;
    })) != null ? _a : {
      key: "Unknown",
      code: "Unknown",
      [type3 === "[" ? "code" : "key"]: descriptor
    };
    defs.push({ keyDef, releasePrevious, releaseSelf, repeat });
    text = text.slice(consumedLength);
  } while (text);
  return defs;
}

// src/keyboard/index.ts
function keyboard(text) {
  return __async(this, null, function* () {
    const actions = parseKeyDef(this[Config].keyboardMap, text);
    return keyboardAction(this[Config], actions);
  });
}
function createKeyboardState() {
  return {
    activeElement: null,
    pressed: [],
    carryChar: "",
    modifiers: {
      Alt: false,
      AltGraph: false,
      Control: false,
      CapsLock: false,
      Fn: false,
      FnLock: false,
      Meta: false,
      NumLock: false,
      ScrollLock: false,
      Shift: false,
      Symbol: false,
      SymbolLock: false
    },
    modifierPhase: {}
  };
}

// src/pointer/parseKeyDef.ts
function parseKeyDef2(pointerMap, keys) {
  const defs = [];
  do {
    const {
      descriptor,
      consumedLength,
      releasePrevious,
      releaseSelf = true
    } = readNextDescriptor(keys, "pointer");
    const keyDef = pointerMap.find((p) => p.name === descriptor);
    if (keyDef) {
      defs.push({ keyDef, releasePrevious, releaseSelf });
    }
    keys = keys.slice(consumedLength);
  } while (keys);
  return defs;
}

// src/pointer/firePointerEvents.ts
function firePointerEvent(config, target, type3, {
  pointerType,
  button,
  coords,
  pointerId,
  isPrimary,
  clickCount
}) {
  const init = __spreadValues({}, coords);
  if (type3 === "click" || type3.startsWith("pointer")) {
    init.pointerId = pointerId;
    init.pointerType = pointerType;
  }
  if (["pointerdown", "pointerup"].includes(type3)) {
    init.isPrimary = isPrimary;
  }
  init.button = getMouseButton(button != null ? button : 0);
  init.buttons = getMouseButtons(...config.pointerState.pressed.filter((p) => p.keyDef.pointerType === pointerType).map((p) => {
    var _a;
    return (_a = p.keyDef.button) != null ? _a : 0;
  }));
  if (["mousedown", "mouseup", "click", "dblclick", "contextmenu"].includes(type3)) {
    init.detail = clickCount;
  }
  return dispatchUIEvent(config, target, type3, init);
}

// src/pointer/resolveSelectionTarget.ts
function resolveSelectionTarget({
  target,
  node,
  offset
}) {
  if (isElementType(target, ["input", "textarea"])) {
    return {
      node: target,
      offset: offset != null ? offset : getUIValue(target).length
    };
  } else if (node) {
    return {
      node,
      offset: offset != null ? offset : node.nodeType === 3 ? node.nodeValue.length : node.childNodes.length
    };
  }
  return findNodeAtTextOffset(target, offset);
}
function findNodeAtTextOffset(node, offset, isRoot = true) {
  let i = offset === void 0 ? node.childNodes.length - 1 : 0;
  const step = offset === void 0 ? -1 : 1;
  while (offset === void 0 ? i >= (isRoot ? Math.max(node.childNodes.length - 1, 0) : 0) : i <= node.childNodes.length) {
    const c = node.childNodes.item(i);
    const text = String(c.textContent);
    if (text.length) {
      if (offset !== void 0 && text.length < offset) {
        offset -= text.length;
      } else if (c.nodeType === 1) {
        return findNodeAtTextOffset(c, offset, false);
      } else {
        if (c.nodeType === 3) {
          return {
            node: c,
            offset: offset != null ? offset : c.nodeValue.length
          };
        }
      }
    }
    i += step;
  }
  return { node, offset: node.childNodes.length };
}

// src/pointer/pointerMove.ts
function pointerMove(_0, _1) {
  return __async(this, arguments, function* (config, { pointerName = "mouse", target, coords, node, offset }) {
    const { pointerState } = config;
    if (!(pointerName in pointerState.position)) {
      throw new Error(`Trying to move pointer "${pointerName}" which does not exist.`);
    }
    const {
      pointerId,
      pointerType,
      target: prevTarget,
      coords: prevCoords,
      selectionRange
    } = pointerState.position[pointerName];
    if (prevTarget && prevTarget !== target) {
      setLevelRef(config, 2 /* Trigger */);
      assertPointerEvents(config, prevTarget);
      fireMove(prevTarget, prevCoords);
      if (!isDescendantOrSelf(target, prevTarget)) {
        fireLeave(prevTarget, prevCoords);
      }
    }
    setLevelRef(config, 2 /* Trigger */);
    assertPointerEvents(config, target);
    pointerState.position[pointerName] = __spreadProps(__spreadValues({}, pointerState.position[pointerName]), {
      target,
      coords
    });
    if (prevTarget !== target) {
      if (!prevTarget || !isDescendantOrSelf(prevTarget, target)) {
        fireEnter(target, coords);
      }
    }
    fireMove(target, coords);
    if (selectionRange) {
      const selectionFocus = resolveSelectionTarget({ target, node, offset });
      if ("node" in selectionRange) {
        if (selectionFocus.node === selectionRange.node) {
          const anchorOffset = selectionFocus.offset < selectionRange.start ? selectionRange.end : selectionRange.start;
          const focusOffset = selectionFocus.offset > selectionRange.end || selectionFocus.offset < selectionRange.start ? selectionFocus.offset : selectionRange.end;
          setUISelection(selectionRange.node, { anchorOffset, focusOffset });
        }
      } else {
        const range = selectionRange.cloneRange();
        const cmp = range.comparePoint(selectionFocus.node, selectionFocus.offset);
        if (cmp < 0) {
          range.setStart(selectionFocus.node, selectionFocus.offset);
        } else if (cmp > 0) {
          range.setEnd(selectionFocus.node, selectionFocus.offset);
        }
        const selection = target.ownerDocument.getSelection();
        selection.removeAllRanges();
        selection.addRange(range.cloneRange());
      }
    }
    function fireMove(eventTarget, eventCoords) {
      fire(eventTarget, "pointermove", eventCoords);
      if (pointerType === "mouse" && !isDisabled(eventTarget)) {
        fire(eventTarget, "mousemove", eventCoords);
      }
    }
    function fireLeave(eventTarget, eventCoords) {
      fire(eventTarget, "pointerout", eventCoords);
      fire(eventTarget, "pointerleave", eventCoords);
      if (pointerType === "mouse" && !isDisabled(eventTarget)) {
        fire(eventTarget, "mouseout", eventCoords);
        fire(eventTarget, "mouseleave", eventCoords);
      }
    }
    function fireEnter(eventTarget, eventCoords) {
      fire(eventTarget, "pointerover", eventCoords);
      fire(eventTarget, "pointerenter", eventCoords);
      if (pointerType === "mouse" && !isDisabled(eventTarget)) {
        fire(eventTarget, "mouseover", eventCoords);
        fire(eventTarget, "mouseenter", eventCoords);
      }
    }
    function fire(eventTarget, type3, eventCoords) {
      return firePointerEvent(config, eventTarget, type3, {
        coords: eventCoords,
        pointerId,
        pointerType
      });
    }
  });
}

// src/pointer/pointerPress.ts
function pointerPress(config, action) {
  return __async(this, null, function* () {
    const { keyDef, target, releasePrevious, releaseSelf } = action;
    const previous = config.pointerState.pressed.find((p) => p.keyDef === keyDef);
    const pointerName = keyDef.pointerType === "touch" ? keyDef.name : keyDef.pointerType;
    const targetIsDisabled = isDisabled(target);
    if (previous) {
      up(config, pointerName, action, previous, targetIsDisabled);
    }
    if (!releasePrevious) {
      const press = down(config, pointerName, action, targetIsDisabled);
      if (releaseSelf) {
        up(config, pointerName, action, press, targetIsDisabled);
      }
    }
  });
}
function getNextPointerId(state) {
  state.pointerId = state.pointerId + 1;
  return state.pointerId;
}
function down(config, pointerName, { keyDef, node, offset, target, coords }, targetIsDisabled) {
  var _a, _b, _c;
  setLevelRef(config, 2 /* Trigger */);
  assertPointerEvents(config, target);
  const { pointerState } = config;
  const { name, pointerType, button } = keyDef;
  const pointerId = pointerType === "mouse" ? 1 : getNextPointerId(pointerState);
  pointerState.position[pointerName] = __spreadProps(__spreadValues({}, pointerState.position[pointerName]), {
    pointerId,
    pointerType,
    target,
    coords
  });
  let isMultiTouch = false;
  let isPrimary = true;
  if (pointerType !== "mouse") {
    for (const obj of pointerState.pressed) {
      if (obj.keyDef.pointerType === pointerType) {
        obj.isMultiTouch = true;
        isMultiTouch = true;
        isPrimary = false;
      }
    }
  }
  if (((_a = pointerState.activeClickCount) == null ? void 0 : _a[0]) !== name) {
    delete pointerState.activeClickCount;
  }
  const clickCount = Number((_c = (_b = pointerState.activeClickCount) == null ? void 0 : _b[1]) != null ? _c : 0) + 1;
  pointerState.activeClickCount = [name, clickCount];
  const pressObj = {
    keyDef,
    downTarget: target,
    pointerId,
    unpreventedDefault: true,
    isMultiTouch,
    isPrimary,
    clickCount
  };
  pointerState.pressed.push(pressObj);
  if (pointerType !== "mouse") {
    fire("pointerover");
    fire("pointerenter");
  }
  if (pointerType !== "mouse" || !pointerState.pressed.some((p) => p.keyDef !== keyDef && p.keyDef.pointerType === pointerType)) {
    fire("pointerdown");
  }
  if (pointerType === "mouse") {
    if (!targetIsDisabled) {
      pressObj.unpreventedDefault = fire("mousedown");
    }
    if (pressObj.unpreventedDefault) {
      mousedownDefaultBehavior({
        target,
        targetIsDisabled,
        clickCount,
        position: pointerState.position[pointerName],
        node,
        offset
      });
    }
    if (button === "secondary") {
      fire("contextmenu");
    }
  }
  return pressObj;
  function fire(type3) {
    return firePointerEvent(config, target, type3, {
      button,
      clickCount,
      coords,
      isPrimary,
      pointerId,
      pointerType
    });
  }
}
function up(config, pointerName, {
  keyDef: { pointerType, button },
  target,
  coords,
  node,
  offset
}, pressed, targetIsDisabled) {
  setLevelRef(config, 2 /* Trigger */);
  assertPointerEvents(config, target);
  const { pointerState } = config;
  pointerState.pressed = pointerState.pressed.filter((p) => p !== pressed);
  const { isMultiTouch, isPrimary, pointerId, clickCount } = pressed;
  let { unpreventedDefault } = pressed;
  pointerState.position[pointerName] = __spreadProps(__spreadValues({}, pointerState.position[pointerName]), {
    target,
    coords
  });
  if (pointerType !== "mouse" || !pointerState.pressed.filter((p) => p.keyDef.pointerType === pointerType).length) {
    fire("pointerup");
  }
  if (pointerType !== "mouse") {
    fire("pointerout");
    fire("pointerleave");
  }
  if (pointerType !== "mouse" && !isMultiTouch) {
    if (!targetIsDisabled) {
      if (clickCount === 1) {
        fire("mouseover");
        fire("mouseenter");
      }
      fire("mousemove");
      unpreventedDefault = fire("mousedown") && unpreventedDefault;
    }
    if (unpreventedDefault) {
      mousedownDefaultBehavior({
        target,
        targetIsDisabled,
        clickCount,
        position: pointerState.position[pointerName],
        node,
        offset
      });
    }
  }
  delete pointerState.position[pointerName].selectionRange;
  if (!targetIsDisabled) {
    if (pointerType === "mouse" || !isMultiTouch) {
      unpreventedDefault = fire("mouseup") && unpreventedDefault;
      const canClick = pointerType !== "mouse" || button === "primary";
      if (canClick && target === pressed.downTarget) {
        fire("click");
        if (clickCount === 2) {
          fire("dblclick");
        }
      }
    }
  }
  function fire(type3) {
    return firePointerEvent(config, target, type3, {
      button,
      clickCount,
      coords,
      isPrimary,
      pointerId,
      pointerType
    });
  }
}
function mousedownDefaultBehavior({
  position,
  target,
  targetIsDisabled,
  clickCount,
  node,
  offset
}) {
  if (!targetIsDisabled) {
    const hasValue = isElementType(target, ["input", "textarea"]);
    const text = String(hasValue ? getUIValue(target) : target.textContent);
    const [start, end] = node ? [offset, offset] : getTextRange(text, offset, clickCount);
    if (hasValue) {
      setUISelection(target, {
        anchorOffset: start != null ? start : text.length,
        focusOffset: end != null ? end : text.length
      });
      position.selectionRange = {
        node: target,
        start: start != null ? start : 0,
        end: end != null ? end : text.length
      };
    } else {
      const { node: startNode, offset: startOffset } = resolveSelectionTarget({
        target,
        node,
        offset: start
      });
      const { node: endNode, offset: endOffset } = resolveSelectionTarget({
        target,
        node,
        offset: end
      });
      const range = target.ownerDocument.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      position.selectionRange = range;
      const selection = target.ownerDocument.getSelection();
      selection.removeAllRanges();
      selection.addRange(range.cloneRange());
    }
  }
  focus(target);
}
function getTextRange(text, pos, clickCount) {
  if (clickCount % 3 === 1 || text.length === 0) {
    return [pos, pos];
  }
  const textPos = pos != null ? pos : text.length;
  if (clickCount % 3 === 2) {
    return [
      textPos - text.substr(0, pos).match(/(\w+|\s+|\W)?$/)[0].length,
      pos === void 0 ? pos : pos + text.substr(pos).match(/^(\w+|\s+|\W)?/)[0].length
    ];
  }
  return [
    textPos - text.substr(0, pos).match(/[^\r\n]*$/)[0].length,
    pos === void 0 ? pos : pos + text.substr(pos).match(/^[^\r\n]*/)[0].length
  ];
}

// src/pointer/pointerAction.ts
function pointerAction(config, actions) {
  return __async(this, null, function* () {
    var _a, _b;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const pointerName = "pointerName" in action && action.pointerName ? action.pointerName : "keyDef" in action ? action.keyDef.pointerType === "touch" ? action.keyDef.name : action.keyDef.pointerType : "mouse";
      const target = (_a = action.target) != null ? _a : getPrevTarget(pointerName, config.pointerState);
      const coords = (_b = action.coords) != null ? _b : pointerName in config.pointerState.position ? config.pointerState.position[pointerName].coords : void 0;
      yield "keyDef" in action ? pointerPress(config, __spreadProps(__spreadValues({}, action), { target, coords })) : pointerMove(config, __spreadProps(__spreadValues({}, action), { target, coords }));
      if (i < actions.length - 1) {
        yield wait(config);
      }
    }
    delete config.pointerState.activeClickCount;
  });
}
function getPrevTarget(pointerName, state) {
  if (!(pointerName in state.position) || !state.position[pointerName].target) {
    throw new Error("This pointer has no previous position. Provide a target property!");
  }
  return state.position[pointerName].target;
}

// src/pointer/index.ts
function pointer(input2) {
  return __async(this, null, function* () {
    const { pointerMap } = this[Config];
    const actions = [];
    (Array.isArray(input2) ? input2 : [input2]).forEach((actionInput) => {
      if (typeof actionInput === "string") {
        actions.push(...parseKeyDef2(pointerMap, actionInput));
      } else if ("keys" in actionInput) {
        actions.push(...parseKeyDef2(pointerMap, actionInput.keys).map((i) => __spreadValues(__spreadValues({}, actionInput), i)));
      } else {
        actions.push(actionInput);
      }
    });
    return pointerAction(this[Config], actions).then(() => void 0);
  });
}
function createPointerState(document) {
  return {
    pointerId: 1,
    position: {
      mouse: {
        pointerType: "mouse",
        pointerId: 1,
        target: document.body,
        coords: {
          clientX: 0,
          clientY: 0,
          offsetX: 0,
          offsetY: 0,
          pageX: 0,
          pageY: 0,
          x: 0,
          y: 0
        }
      }
    },
    pressed: []
  };
}

// src/setup/config.ts
var Config = Symbol("Config");

// src/setup/api.ts
var api_exports = {};
__export(api_exports, {
  clear: () => clear,
  click: () => click,
  copy: () => copy,
  cut: () => cut,
  dblClick: () => dblClick,
  deselectOptions: () => deselectOptions,
  hover: () => hover,
  keyboard: () => keyboard,
  paste: () => paste,
  pointer: () => pointer,
  selectOptions: () => selectOptions,
  tab: () => tab,
  tripleClick: () => tripleClick,
  type: () => type,
  unhover: () => unhover,
  upload: () => upload
});

// src/convenience/click.ts
function click(element) {
  return __async(this, null, function* () {
    const pointerIn = [];
    if (!this[Config].skipHover) {
      pointerIn.push({ target: element });
    }
    pointerIn.push({ keys: "[MouseLeft]", target: element });
    return this.pointer(pointerIn);
  });
}
function dblClick(element) {
  return __async(this, null, function* () {
    return this.pointer([{ target: element }, "[MouseLeft][MouseLeft]"]);
  });
}
function tripleClick(element) {
  return __async(this, null, function* () {
    return this.pointer([{ target: element }, "[MouseLeft][MouseLeft][MouseLeft]"]);
  });
}

// src/convenience/hover.ts
function hover(element) {
  return __async(this, null, function* () {
    return this.pointer({ target: element });
  });
}
function unhover(element) {
  return __async(this, null, function* () {
    return this.pointer({ target: element.ownerDocument.body });
  });
}

// src/convenience/tab.ts
function tab() {
  return __async(this, arguments, function* ({
    shift
  } = {}) {
    return this.keyboard(shift === true ? "{Shift>}{Tab}{/Shift}" : shift === false ? "[/ShiftLeft][/ShiftRight]{Tab}" : "{Tab}");
  });
}

// src/clipboard/copy.ts
function copy() {
  return __async(this, null, function* () {
    var _a;
    const doc = this[Config].document;
    const target = (_a = doc.activeElement) != null ? _a : doc.body;
    const clipboardData = copySelection(target);
    if (clipboardData.items.length === 0) {
      return;
    }
    if (this.dispatchUIEvent(target, "copy", {
      clipboardData
    }) && this[Config].writeToClipboard) {
      yield writeDataTransferToClipboard(doc, clipboardData);
    }
    return clipboardData;
  });
}

// src/clipboard/cut.ts
function cut() {
  return __async(this, null, function* () {
    var _a;
    const doc = this[Config].document;
    const target = (_a = doc.activeElement) != null ? _a : doc.body;
    const clipboardData = copySelection(target);
    if (clipboardData.items.length === 0) {
      return;
    }
    if (this.dispatchUIEvent(target, "cut", {
      clipboardData
    }) && this[Config].writeToClipboard) {
      yield writeDataTransferToClipboard(target.ownerDocument, clipboardData);
    }
    return clipboardData;
  });
}

// src/clipboard/paste.ts
function paste(clipboardData) {
  return __async(this, null, function* () {
    var _a, _b;
    const doc = this[Config].document;
    const target = (_a = doc.activeElement) != null ? _a : doc.body;
    const dataTransfer = (_b = typeof clipboardData === "string" ? getClipboardDataFromString(doc, clipboardData) : clipboardData) != null ? _b : yield readDataTransferFromClipboard(doc).catch(() => {
      throw new Error("`userEvent.paste()` without `clipboardData` requires the `ClipboardAPI` to be available.");
    });
    this.dispatchUIEvent(target, "paste", {
      clipboardData: dataTransfer
    });
  });
}
function getClipboardDataFromString(doc, text) {
  const dt = createDataTransfer(getWindow(doc));
  dt.setData("text", text);
  return dt;
}

// src/utility/clear.ts
function clear(element) {
  return __async(this, null, function* () {
    if (!isEditable(element) || isDisabled(element)) {
      throw new Error("clear()` is only supported on editable elements.");
    }
    focus(element);
    if (element.ownerDocument.activeElement !== element) {
      throw new Error("The element to be cleared could not be focused.");
    }
    selectAll(element);
    if (!isAllSelected(element)) {
      throw new Error("The element content to be cleared could not be selected.");
    }
    input(this[Config], element, "", "deleteContentBackward");
  });
}

// src/utility/selectOptions.ts
import { getConfig as getConfig3 } from "@testing-library/dom";
function selectOptions(select, values) {
  return __async(this, null, function* () {
    return selectOptionsBase.call(this, true, select, values);
  });
}
function deselectOptions(select, values) {
  return __async(this, null, function* () {
    return selectOptionsBase.call(this, false, select, values);
  });
}
function selectOptionsBase(newValue, select, values) {
  return __async(this, null, function* () {
    if (!newValue && !select.multiple) {
      throw getConfig3().getElementError(`Unable to deselect an option in a non-multiple select. Use selectOptions to change the selection instead.`, select);
    }
    const valArray = Array.isArray(values) ? values : [values];
    const allOptions = Array.from(select.querySelectorAll('option, [role="option"]'));
    const selectedOptions = valArray.map((val) => {
      if (typeof val !== "string" && allOptions.includes(val)) {
        return val;
      } else {
        const matchingOption = allOptions.find((o) => o.value === val || o.innerHTML === val);
        if (matchingOption) {
          return matchingOption;
        } else {
          throw getConfig3().getElementError(`Value "${String(val)}" not found in options`, select);
        }
      }
    }).filter((option) => !isDisabled(option));
    if (isDisabled(select) || !selectedOptions.length)
      return;
    const selectOption = (option) => {
      option.selected = newValue;
      this.dispatchUIEvent(select, "input", {
        bubbles: true,
        cancelable: false,
        composed: true
      });
      this.dispatchUIEvent(select, "change");
    };
    if (isElementType(select, "select")) {
      if (select.multiple) {
        for (const option of selectedOptions) {
          const withPointerEvents = this[Config].pointerEventsCheck === 0 ? true : hasPointerEvents(option);
          if (withPointerEvents) {
            this.dispatchUIEvent(option, "pointerover");
            this.dispatchUIEvent(select, "pointerenter");
            this.dispatchUIEvent(option, "mouseover");
            this.dispatchUIEvent(select, "mouseenter");
            this.dispatchUIEvent(option, "pointermove");
            this.dispatchUIEvent(option, "mousemove");
            this.dispatchUIEvent(option, "pointerdown");
            this.dispatchUIEvent(option, "mousedown");
          }
          focus(select);
          if (withPointerEvents) {
            this.dispatchUIEvent(option, "pointerup");
            this.dispatchUIEvent(option, "mouseup");
          }
          selectOption(option);
          if (withPointerEvents) {
            this.dispatchUIEvent(option, "click");
          }
          yield wait(this[Config]);
        }
      } else if (selectedOptions.length === 1) {
        const withPointerEvents = this[Config].pointerEventsCheck === 0 ? true : hasPointerEvents(select);
        if (withPointerEvents) {
          yield this.click(select);
        } else {
          focus(select);
        }
        selectOption(selectedOptions[0]);
        if (withPointerEvents) {
          this.dispatchUIEvent(select, "pointerover");
          this.dispatchUIEvent(select, "pointerenter");
          this.dispatchUIEvent(select, "mouseover");
          this.dispatchUIEvent(select, "mouseenter");
          this.dispatchUIEvent(select, "pointerup");
          this.dispatchUIEvent(select, "mouseup");
          this.dispatchUIEvent(select, "click");
        }
        yield wait(this[Config]);
      } else {
        throw getConfig3().getElementError(`Cannot select multiple options on a non-multiple select`, select);
      }
    } else if (select.getAttribute("role") === "listbox") {
      for (const option of selectedOptions) {
        yield this.click(option);
        yield this.unhover(option);
      }
    } else {
      throw getConfig3().getElementError(`Cannot select options on elements that are neither select nor listbox elements`, select);
    }
  });
}

// src/utility/type.ts
function type(_0, _1) {
  return __async(this, arguments, function* (element, text, {
    skipClick = this[Config].skipClick,
    skipAutoClose = this[Config].skipAutoClose,
    initialSelectionStart,
    initialSelectionEnd
  } = {}) {
    if (element.disabled)
      return;
    if (!skipClick) {
      yield this.click(element);
    }
    if (initialSelectionStart !== void 0) {
      setSelectionRange(element, initialSelectionStart, initialSelectionEnd != null ? initialSelectionEnd : initialSelectionStart);
    }
    yield this.keyboard(text);
    if (!skipAutoClose) {
      yield releaseAllKeys(this[Config]);
    }
  });
}

// src/utility/upload.ts
function upload(element, fileOrFiles) {
  return __async(this, null, function* () {
    const input2 = isElementType(element, "label") ? element.control : element;
    if (!input2 || !isElementType(input2, "input", { type: "file" })) {
      throw new TypeError(`The ${input2 === element ? "given" : "associated"} ${input2 == null ? void 0 : input2.tagName} element does not accept file uploads`);
    }
    if (isDisabled(element))
      return;
    const files = (Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]).filter((file) => !this[Config].applyAccept || isAcceptableFile(file, input2.accept)).slice(0, input2.multiple ? void 0 : 1);
    const fileDialog = () => {
      var _a;
      if (files.length === ((_a = input2.files) == null ? void 0 : _a.length) && files.every((f, i) => {
        var _a2;
        return f === ((_a2 = input2.files) == null ? void 0 : _a2.item(i));
      })) {
        return;
      }
      setFiles(input2, createFileList(files));
      this.dispatchUIEvent(input2, "input");
      this.dispatchUIEvent(input2, "change");
    };
    input2.addEventListener("fileDialog", fileDialog);
    yield this.click(element);
    input2.removeEventListener("fileDialog", fileDialog);
  });
}
function isAcceptableFile(file, accept) {
  if (!accept) {
    return true;
  }
  const wildcards = ["audio/*", "image/*", "video/*"];
  return accept.split(",").some((acceptToken) => {
    if (acceptToken.startsWith(".")) {
      return file.name.endsWith(acceptToken);
    } else if (wildcards.includes(acceptToken)) {
      return file.type.startsWith(acceptToken.substr(0, acceptToken.length - 1));
    }
    return file.type === acceptToken;
  });
}

// src/setup/wrapAsync.ts
import { getConfig as getDOMTestingLibraryConfig } from "@testing-library/dom";
function wrapAsync(implementation) {
  return getDOMTestingLibraryConfig().asyncWrapper(implementation);
}

// src/setup/setup.ts
function createConfig(options = {}, defaults = defaultOptionsSetup, node) {
  const document = getDocument(options, node, defaults);
  const {
    keyboardState = createKeyboardState(),
    pointerState = createPointerState(document)
  } = options;
  return __spreadProps(__spreadValues(__spreadValues({}, defaults), options), {
    document,
    keyboardState,
    pointerState
  });
}
function setupMain(options = {}) {
  var _a;
  const config = createConfig(options);
  prepareDocument(config.document);
  const view = (_a = config.document.defaultView) != null ? _a : globalThis.window;
  attachClipboardStubToView(view);
  return doSetup(config);
}
function setupDirect(options = {}, node) {
  const config = createConfig(options, defaultOptionsDirect, node);
  prepareDocument(config.document);
  return {
    config,
    api: doSetup(config)
  };
}
function setupSub(options) {
  return doSetup(__spreadValues(__spreadValues({}, this[Config]), options));
}
function wrapAndBindImpl(instance, impl) {
  function method(...args) {
    setLevelRef(instance[Config], 1 /* Call */);
    return wrapAsync(() => impl.apply(instance, args).then((ret) => __async(this, null, function* () {
      yield wait(instance[Config]);
      return ret;
    })));
  }
  Object.defineProperty(method, "name", { get: () => impl.name });
  return method;
}
function doSetup(config) {
  const instance = __spreadValues({
    [Config]: config,
    dispatchUIEvent: bindDispatchUIEvent(config)
  }, api_exports);
  return __spreadProps(__spreadValues({}, Object.fromEntries(Object.entries(api_exports).map(([name, api]) => [
    name,
    wrapAndBindImpl(instance, api)
  ]))), {
    setup: setupSub.bind(instance)
  });
}
function getDocument(options, node, defaults) {
  var _a, _b;
  return (_b = (_a = options.document) != null ? _a : node && getDocumentFromNode(node)) != null ? _b : defaults.document;
}

// src/setup/directApi.ts
var directApi_exports = {};
__export(directApi_exports, {
  clear: () => clear2,
  click: () => click2,
  copy: () => copy2,
  cut: () => cut2,
  dblClick: () => dblClick2,
  deselectOptions: () => deselectOptions2,
  hover: () => hover2,
  keyboard: () => keyboard2,
  paste: () => paste2,
  pointer: () => pointer2,
  selectOptions: () => selectOptions2,
  tab: () => tab2,
  tripleClick: () => tripleClick2,
  type: () => type2,
  unhover: () => unhover2,
  upload: () => upload2
});
function clear2(element) {
  return setupDirect().api.clear(element);
}
function click2(element, options = {}) {
  return setupDirect(options, element).api.click(element);
}
function copy2(options = {}) {
  return setupDirect(options).api.copy();
}
function cut2(options = {}) {
  return setupDirect(options).api.cut();
}
function dblClick2(element, options = {}) {
  return setupDirect(options).api.dblClick(element);
}
function deselectOptions2(select, values, options = {}) {
  return setupDirect(options).api.deselectOptions(select, values);
}
function hover2(element, options = {}) {
  return setupDirect(options).api.hover(element);
}
function keyboard2(_0) {
  return __async(this, arguments, function* (text, options = {}) {
    const { config, api } = setupDirect(options);
    return api.keyboard(text).then(() => config.keyboardState);
  });
}
function pointer2(_0) {
  return __async(this, arguments, function* (input2, options = {}) {
    const { config, api } = setupDirect(options);
    return api.pointer(input2).then(() => config.pointerState);
  });
}
function paste2(clipboardData, options) {
  return setupDirect(options).api.paste(clipboardData);
}
function selectOptions2(select, values, options = {}) {
  return setupDirect(options).api.selectOptions(select, values);
}
function tripleClick2(element, options = {}) {
  return setupDirect(options).api.tripleClick(element);
}
function type2(element, text, options = {}) {
  return setupDirect(options, element).api.type(element, text, options);
}
function unhover2(element, options = {}) {
  const { config, api } = setupDirect(options);
  config.pointerState.position.mouse.target = element;
  return api.unhover(element);
}
function upload2(element, fileOrFiles, options = {}) {
  return setupDirect(options).api.upload(element, fileOrFiles);
}
function tab2(options = {}) {
  return setupDirect().api.tab(options);
}

// src/setup/index.ts
var userEvent = __spreadProps(__spreadValues({}, directApi_exports), {
  setup: setupMain
});
export {
  PointerEventsCheckLevel,
  userEvent as default
};
