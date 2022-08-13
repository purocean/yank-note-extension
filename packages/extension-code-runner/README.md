# Code Runner

Run code for multiple languages: BASH/SH, PHP, Python, Node.js.

*[Note: This plugin is not available for Mac App Store downloaded Yank Note.](https://github.com/purocean/yn/issues/65#issuecomment-1065799677)*

The first line of the code block needs to contain the string `--run--`.

```js
// --run--
await new Promise(r => setTimeout(r, 500))
ctx.ui.useToast().show("info", "HELLOWORLD!")
console.log('HELLOWORD')
```

```node
// --run--
console.log('HELLOWORD')
```

```php
// --run--
echo 'HELLOWORD!';
```

```python
# --run--
print('HELLOWORD')
```

```shell
# --run--
date
```

```bat
REM --run--
@echo HELLOWORD
```
