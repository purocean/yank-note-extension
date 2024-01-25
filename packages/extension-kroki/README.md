# Kroki Extension

This extension allow you create diagrams using [Kroki](https://kroki.io/) in Yank Note.

## Usage

Add `--kroki-- [diagram type]` before your diagram code block.

For example, if you want to create a `wavedrom` diagram, you can use the following code block:

~~~markdown
```js
// --kroki-- wavedrom
{ signal: [
  { name: "clk",         wave: "p.....|..." },
  { name: "Data",        wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] },
  { name: "Request",     wave: "0.1..0|1.0" },
  {},
  { name: "Acknowledge", wave: "1.....|01." }
]}
```
~~~

If you want to customize the kroki server, you can go `Settings` -> `Plugin` -> `Kroki Image URL` to set it.

## Screenshots
![image](https://github.com/purocean/yank-note-extension/assets/7115690/16191ce4-a0cd-4ef8-b415-6ce61f77c60c)
