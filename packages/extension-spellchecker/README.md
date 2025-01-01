# Spellchecker

This extension uses the [hunspell-asm](https://github.com/kwonoj/hunspell-asm) and [monaco-spellchecker](https://github.com/purocean/monaco-spellchecker) libraries to provide spellchecking capabilities in the editor.

![image](https://github.com/user-attachments/assets/63075228-b09f-492f-a6fe-14acb82ee0a5)

## Enable or disable spellchecking

- You can enable or disable spellchecking by menu `Tool` -> `Check Spelling`.
- 你可以通过菜单 `工具` -> `拼写检查` 来启用或禁用拼写检查。

## Change the language

- The default language is English, but you can change it by setting.
- 默认语言是英语，但你可以通过设置来更改。

![image](https://github.com/user-attachments/assets/3bde2f91-e338-4e28-8236-867f21192970)

1. Download the dictionary file `.dic` and `.aff` from Web (e.g. https://github.com/wooorm/dictionaries/tree/main/dictionaries)
2. Put the dictionary file to the `<home>/yank-note/data/@yank-note$extension-spellchecker` directory
3. Set the language in the settings.
4. Change the word matching regular expression if necessary.

---

1. 下载 `.dic` 和 `.aff` 的字典文件 (例如 https://github.com/wooorm/dictionaries/tree/main/dictionaries)
2. 将字典文件放到 `<home>/yank-note/data/@yank-note$extension-spellchecker` 目录下
3. 在设置中设置语言
4. 如有必要，请更改单词匹配正则表达式。

## Files

- All dictionary files are placed in the `<home>/yank-note/data/@yank-note$extension-spellchecker` directory.
- `ignore.txt`: The words in this file will be ignored by the spellchecker.
- `user-dic.txt`: The words in this file will be added to the dictionary, which can be used for word suggestions.
---

- 所有的字典文件都放置在 `<home>/yank-note/data/@yank-note$extension-spellchecker` 目录中。
- `ignore.txt`: 此文件中的单词将被拼写检查器忽略。
- `user-dic.txt`: 此文件中的单词将被添加到字典中，可用于单词建议。
