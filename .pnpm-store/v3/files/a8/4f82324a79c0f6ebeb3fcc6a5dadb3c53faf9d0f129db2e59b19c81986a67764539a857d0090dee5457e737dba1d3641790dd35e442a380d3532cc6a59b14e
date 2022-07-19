class Node {
  constructor(value) {
    this.value = value;
  }

}

class Queue {
  constructor() {
    this.clear();
  }

  clear() {
    this._head = undefined;
    this._tail = undefined;
    this._size = 0;
  }

  push(value) {
    const node = new Node(value);

    if (this._head) {
      this._tail.next = node;
      this._tail = node;
    } else {
      this._head = node;
      this._tail = node;
    }

    this._size++;
    return this._size;
  }

  pop() {
    const current = this._head;

    if (!current) {
      return;
    }

    this._head = this._head.next;
    this._size--;
    return current.value;
  }

  get size() {
    return this._size;
  }

  *[Symbol.iterator]() {
    let current = this._head;

    while (current) {
      yield current.value;
      current = current.next;
    }
  }

}

export { Queue };
