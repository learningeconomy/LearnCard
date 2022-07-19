/** Tests from https://reactjs.org/docs/testing-recipes.html#rendering */
import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";

import { Berries } from "../src";

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

describe("Berries", () => {
  it("renders with and without name", () => {
    act(() => {
      render(<Berries />, container);
    });

    expect(container?.textContent).toBe(
      "Hello, stranger. I'm built with aqu 🌊!"
    );

    act(() => {
      render(<Berries name="Jenny" />, container);
    });

    expect(container?.textContent).toBe("Hello, Jenny. I'm built with aqu 🌊!");

    act(() => {
      render(<Berries name="Margaret" />, container);
    });

    expect(container?.textContent).toBe(
      "Hello, Margaret. I'm built with aqu 🌊!"
    );
  });
});
