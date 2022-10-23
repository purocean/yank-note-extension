# Markmap

This extension integrates [Markmap](https://markmap.js.org/) into Yank Note.

Visualize your Markdown as mindmaps with Markmap.

## Screenshots

![image](https://user-images.githubusercontent.com/7115690/181574494-38730b79-ab11-4197-b0a3-5225ab72a5b0.png)

## Usage

### List

Just need to add `{.mindmap}` to the end of root node of the list.

```markdown
+ Central node{.markmap}
    + **1** State Visibility
    + **2** Environmental Appropriate
    + **3** User Controllable
    + **4** Consistency
    + **5** Error Proofing
    + **6** Accessibility
    + **7** Agility and Efficiency
    + **8** Grace and Simplicity
    + **9** Fault Tolerance
    + **10** Friendly Help
```

### Code block

~~~markdown
```markmap
- ABC
    - DEF
    - GHI
    - JKL
```
~~~
### Entire document

~~~markdown
---
defaultPreviewer: 'Markmap'
---

# markmap

## Links

- <https://markmap.js.org/>
- [GitHub](https://github.com/gera2ld/markmap)

## Related Projects

- [coc-markmap](https://github.com/gera2ld/coc-markmap)
- [gatsby-remark-markmap](https://github.com/gera2ld/gatsby-remark-markmap)

## Features

- links
- **strong** ~~del~~ *italic* ==highlight==
- multiline
  text
- `inline code`
-
    ```js
    console.log('code block');
    ```
- Katex
  - $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$
- Now we can wrap very very very very long text based on `maxWidth` option
~~~

Click "Previewer" -> "Markmap" in the right of status bar.

点击状态栏右侧的菜单：“预览器” -> “Markmap”。
