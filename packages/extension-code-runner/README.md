# Code Runner

Run code for multiple languages: BASH/SH, PHP, Python, Node.js, Bat, C, Java and more.

*[Note: This plugin is not available for Mac App Store downloaded Yank Note.](https://github.com/purocean/yn/issues/65#issuecomment-1065799677)*

The first line of the code block needs to contain the string `--run--`.

~~~markdown

```js
// --run--
await new Promise(r => setTimeout(r, 500))
ctx.ui.useToast().show("info", "HELLOWORLD!")
console.log('HELLOWORLD')
```

```node
// --run--
console.log('HELLOWORLD')
```

```php
// --run--
echo 'HELLOWORLD!';
```

```python
# --run--
print('HELLOWORLD')
```

```shell
# --run--
date
```

```bat
REM --run--
@echo HELLOWORLD
```

```c
// --run-- gcc $tmpFile.c -o $tmpFile.out && $tmpFile.out

#include <stdio.h>

int main () {
    printf("Hello, World!");
    return 0;
}
```

```java
// --run-- java $tmpFile.java

class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```
~~~
