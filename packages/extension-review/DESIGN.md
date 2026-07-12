# 审阅批注扩展设计

## 目标

AI 生成的文章经常需要人工审阅后再交给 AI 整体修改。本扩展允许用户在 Yank Note 预览中选择任意长度的渲染文本，添加可编辑批注，并把定位上下文与批注意见保存在原 Markdown 文档末尾。

首版目标：

- 支持预览中的跨文本节点、跨段落选区。
- 正文不插入行内标记，不改变原有 Markdown 结构。
- 批注对人和 AI 都保持可读。
- 重新打开、重新渲染或 AI 修改正文后尽量恢复选区。
- 定位置信度不足时不误标，并明确提示定位失效。

首版不实现评论线程、作者、时间、状态、多人实时协作和精确 Markdown 字符映射。

## 存储协议

正文与批注之间用水平线分隔。每条批注使用一个 Yank Note `section` 容器；上下文以引用块放在可折叠的 `details` 容器中，评论则以普通 Markdown 放在无标题的 `tip` 容器中。固定样式类承担机器语义。

```md
---

:::: section 批注 · r7f2 {#yn-review-r7f2 data-rendered-range="384:872" data-source-lines="12:18"}
::: details 上下文
> 上一段最后的一小段文字……
{.yn-review-prefix}

> 被选内容开头的一部分文字……
{.yn-review-head}

> *……中间省略 4718 字……*
{.yn-review-omitted data-chars="4718"}

> 被选内容结尾的一部分文字……
{.yn-review-tail}

> 下一段开头的一小段文字……
{.yn-review-suffix}
:::
::: tip {.yn-review-comment}
这几段请整体重写，按照“问题、证据、结论”重新组织。
:::
::::
```

短选区使用 `.yn-review-exact` 保存完整选中文字；长选区使用 `.yn-review-head`、`.yn-review-tail` 和 `.yn-review-omitted` 保存首尾摘要。

固定协议标记：

- `#yn-review-*`：唯一批注 ID，也是文末跳转锚点。
- `data-rendered-range`：规范化预览文本坐标，不是源码位置。
- `data-source-lines`：大概源码行范围，仅用于候选评分和失败兜底。
- `.yn-review-prefix/.yn-review-suffix`：选区外上下文。
- `.yn-review-exact`：短选区全文。
- `.yn-review-head/.yn-review-tail`：长选区边界。
- `.yn-review-omitted`：被省略的选区中段。
- `.yn-review-comment`：用户批注意见。

源码保留“上下文”标题方便人类和 AI 识别；各片段不显示额外标题，其顺序和固定样式类保证程序解析明确。扩展在渲染层使用 `exact` 或 `head + tail` 替换可见的 `details` 摘要，摘要限制为单行并在溢出时显示省略号，因此 Markdown 中不重复存储一份选中文字标题。

## 长度限制

- 完整选区不超过 256 个渲染字符时保存全文。
- 长选区保存开头 128 字、结尾 128 字。
- 选区外前文和后文各保存最多 80 字。
- 中间正文不重复存储，仅保存省略字符数。

这些限制是扩展内部常量，首版不增加设置项。

## 预览文本坐标

扩展在每次 `VIEW_RENDERED` 后遍历预览正文，构建规范化文本及其到 DOM Text Node 的映射。批注容器和扩展自己的浮动 UI 不进入坐标系。

该索引支持：

- DOM Range 转 `data-rendered-range`。
- 渲染坐标转 DOM Range。
- 从选区提取 exact/head/tail/prefix/suffix。

块级元素和 `<br>` 在规范化文本中形成稳定换行。坐标只作为快速路径，不能单独作为批注身份。

## 定位算法

重新渲染后按以下顺序恢复：

1. 使用 `data-rendered-range` 恢复候选 Range，并用 exact 或 head/tail 验证。
2. 对空白、大小写和常见中英文标点进行规范化后，在全文查找 exact 或按顺序出现的 head/tail。
3. 通过 prefix/suffix、原始渲染位置、选区长度和大概源码行给候选评分。
4. 多个候选接近或置信度不足时标记为未定位，不进行可能误标的编辑距离匹配。

未定位的批注仍保留在文末并显示失效提示；定位操作可退化为跳到大概源码行。

## 交互

### 创建

1. 用户在默认预览中选择文字。
2. 最后一个选区矩形附近显示悬浮批注按钮。
3. 用户也可执行 `Ctrl/Cmd + Alt + M` 对应的扩展 action。
4. 点击后在选区附近显示评论输入面板。
5. 点击输入框右下角的发送图标或按 `Ctrl/Cmd + Enter` 保存；右上角关闭图标、`Esc`、点击浮层外部或失去焦点时取消。
6. 保存时按批注在当前预览中的起始位置重新排列文末批注，并通过一次 Monaco edit 写回。写回和预览重绘由 Yank Note 的 `disableSyncScrollAwhile()` 包裹，临时禁止编辑器驱动预览滚动，随后自动恢复用户原有的同步滚动设置。

### 查看与维护

- 所有已定位批注使用普通高亮。
- 当前批注使用强化高亮。
- 点击正文高亮可打开编辑面板。
- 文末批注使用图标操作区提供定位、编辑和删除；默认隐藏，鼠标移入批注卡片或键盘聚焦时显示。
- 未定位警告始终显示。
- 批注卡片和编辑面板都提供删除入口；编辑面板中的删除图标位于关闭图标左侧。删除不弹出确认框；第一次点击后删除图标展开为红色的“再次点击删除”按钮，短时间内再次点击执行删除。
- 定位失败时“定位”退化为跳转到大概源码行。

## 高亮

扩展复用 Yank Note 的 `createTextHighlighter`。本体工具增加 `highlightRanges()`，并根据容器的 `ownerDocument` 使用正确的 iframe `HighlightRegistry`。扩展维护两组高亮：

- `yn-review`: 所有已定位批注。
- `yn-review-active`: 当前激活批注。

高亮不包裹或修改 Markdown 预览 DOM。

## AI 工作流

推荐给 AI 的约束：

> 根据文末水平线后的审阅批注修改正文，但保留批注区，等待人工确认。

AI 大幅修改正文后，扩展会重新定位。边界仍在时继续高亮；边界消失时显示未定位，由人工确认。人工确认修改完成后删除批注。

## 扩展边界

除 `createTextHighlighter.highlightRanges()` 与 iframe 作用域外，功能均位于 `@yank-note/extension-review`：

- 存储序列化与解析。
- 渲染文本索引。
- 选区捕获与重新定位。
- 悬浮按钮和评论输入面板。
- 文末批注增强与维护操作。
