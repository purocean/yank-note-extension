# 编辑装订线扩展设计

## 目标

扩展在 Yank Note 默认 Monaco 编辑器的行号左侧显示行级变更，帮助用户快速识别当前文档中新增、修改和删除的位置。它只处理非分享模式下可编辑的 plain 文件；应用全局只读、文件不可写或当前不是默认编辑器时不工作。

基线自动选择：

- Git 文件：使用 `HEAD` 中的文件内容。保存文档不会清除标记，提交或切换分支后更新。
- 非 Git 文件：使用对应 Tab 第一次进入编辑器时的内容。自动保存不会改变基线，关闭 Tab 后释放。
- Git、RPC 或运行环境不可用：无声降级为 Tab 基线，不影响编辑。
- 用户点击“清除全部标记”：当前内容成为该 Tab 的手动基线，后续不再检查 Git；关闭 Tab 后释放。

扩展不增加单独设置。用户通过扩展管理器启用或禁用整个功能。

点击装订线会在对应变更块前展开轻量 ViewZone，展示删除和新增内容，并允许将这一变更块还原到当前基线。扩展不实现暂存、提交或完整 Source Control 面板；这些操作需要更复杂的 Git 状态模型，不属于当前职责。

## 扩展边界

全部功能位于 `@yank-note/extension-change-gutter`，不修改 Yank Note 本体：

- 通过 `ctx.editor` 监听 Monaco model 并维护 decorations。
- 通过 `ctx.store.state.tabs` 管理 Tab 基线生命周期。
- 通过已有 `ctx.api.rpc()` 在服务端执行 Git 命令。
- 行级 Diff 依赖打包在扩展内。

扩展只在 `MODE === 'normal'` 时初始化。分享预览不会注册样式、Hook 或 Controller。Controller 进一步要求：

- 当前是默认编辑器。
- 当前文档是 `type === 'file'` 且 `plain === true`。
- `writeable !== false`。
- 应用未启用 `FLAG_READONLY`。

这些条件与 Yank Note 默认编辑器的可编辑判断保持一致。管理员 RPC 不可用时，Git 基线不可用，但 Tab 基线仍可正常工作。

## 模块

```text
main.ts
  ├── 检查运行模式并注册样式、语言和生命周期 Hook
  └── ChangeGutterController
        ├── BaselineStore
        ├── fetchGitBaseline → ctx.api.rpc
        ├── computeLineChanges → ChangeHunk[] + LineChange[]
        ├── createDecorationSpecs → Monaco decorations
        ├── ChangePreviewWidget → Monaco ViewZone
        └── restoreHunkContent → Monaco executeEdits
```

### `controller.ts`

唯一的运行时编排层。它只关心当前激活的默认 Monaco model：

- 新 URI 首次进入时只捕获 Tab 快照，不执行 Git RPC 或 Diff。
- 内容变化后延迟触发基线检查和 Diff。
- Tab 切换回来或窗口重新聚焦时强制检查 Git revision，然后计算 Diff。
- 每个 URI 独立记录 Git pending 和检查时间，防止连续输入重复发起 RPC。
- Git 请求可在 Tab 切走后完成并更新对应缓存，但只给当前激活 URI 渲染 decorations。
- 只保存当前 model 的最新 Diff 版本；内容、model 或待刷新的 Git 基线变化时立即关闭预览并使点击映射失效。
- 点击只响应本扩展的 `GUTTER_LINE_DECORATIONS`，不会截获行号或其他扩展的 gutter 区域。

### `baseline-store.ts`

以 Monaco 文档 URI 为键保存状态：

```ts
type BaselineEntry = {
  tabContent: string
  baseline: ChangeBaseline
  gitCheckedAt?: number
  gitRequestId?: number
}
```

`tabContent` 只在 URI 尚无记录时捕获，直到关闭 Tab 都不会更新。`baseline` 是当前实际用于 Diff 的 Git、Tab 或手动基线。`gitCheckedAt` 同时承担缓存有效期和失败重试退避；`gitRequestId` 存在即表示请求在途，既防止同一 URI 并发检查，也用于拒绝关闭并快速重开同一 URI 后返回的旧结果。

手动基线使用 `source: 'manual'` 表示。`shouldRefreshGit()` 和 `beginGitCheck()` 会直接拒绝 manual 状态；即使设置手动基线前已有 RPC 在途，返回结果也不会覆盖它。关闭 Tab 删除整个 Entry，因此重新打开后恢复自动 Git/Tab 选择，不需要额外的重置状态。

监听 Tabs 列表并删除已关闭文档的记录，因此在 Tab 间切换不会重置，关闭再打开则会重新建立。

Git 返回 `none` 时：

- 无论当前使用哪种基线，都恢复为原始 `tabContent`。

这可以避免文件离开 Git 或变成 ignored 后，把“当前内容”错误地当成新的 Tab 打开快照。

### `git-rpc.ts` 与 `server/git-baseline.cjs`

扩展系统没有单独的服务端入口，因此扩展附带一个小型 CommonJS Node helper。`git-rpc.ts` 生成的 RPC 只定位扩展安装目录中的 `server/git-baseline.cjs` 并调用它；Git 判断和命令执行都在 helper 内，不把业务逻辑写进动态代码字符串。

helper 直接随扩展发布，不经过 renderer bundle，既不依赖打包器的函数序列化行为，也可以在单测中注入假的 `execFile`，无需机器安装 Git。RPC 每次调用前清除该 helper 的 Node 模块缓存，扩展热更新后不会继续执行旧实现。

RPC bridge 在 WSL 环境下复用 Yank Note 的路径转换，将 renderer 中的 Windows 绝对路径转为 Git 可访问的 WSL 路径。

Git 命令全部使用 `child_process.execFile()` 参数数组，不经过 shell。路径通过 `JSON.stringify()` 写入 RPC 请求，避免命令和代码注入。

执行顺序：

1. `git -C <file-dir> rev-parse --show-toplevel`
2. 校验文件确实位于返回的 Git 根目录内。
3. `git rev-parse --verify HEAD`；revision 与已缓存 revision 相同且原文件已被 HEAD 跟踪时，不重复传输文件内容。
4. `git cat-file -e HEAD:<path>` 判断文件是否存在于 HEAD。
5. 已跟踪文件直接 `git show HEAD:<path>` 读取；只有无 commit 或文件不在 HEAD 时才运行 `git check-ignore`，被忽略文件使用 Tab 基线。

聚焦刷新一个已缓存的 Git 文件通常只需要两次轻量 Git 调用：定位仓库和读取 HEAD revision。

单次命令限制为 3 秒和 8 MiB 输出。Git 命令用退出码区分“没有仓库/没有 HEAD/文件不在 HEAD”等正常状态与可执行文件缺失、超时、内容过大等运行故障；运行故障使 RPC 失败，renderer 保留已有基线，不会错误地把整篇标成新文件。

只对已跟踪文件复用 `knownRevision`。Git 新文件每次聚焦仍检查一次 `cat-file`，避免它提交后仍长期使用空基线。

加密文档不请求 Git，因为编辑器中是明文，而 Git blob 可能是密文，两者不可直接比较。

### `line-diff.ts`

Diff 在 renderer 中进行，输入始终是“基线内容 + 当前 Monaco 内容”，所以未保存编辑会立即显示。

性能措施：

- 内容相同直接返回。
- 120ms debounce，连续输入只计算一次。
- 普通输入只在 Git 基线从未检查或已超过 30 秒时刷新；连续输入不会反复调用 Git。
- Tab 返回和窗口聚焦属于外部状态可能变化的边界，会强制刷新 Git。
- 先剥离完全相同的行前缀和后缀，典型单点编辑只对很小的中间区域运行算法。
- 文档上限 2 MiB，变化中间区上限 10,000 行。
- 行 Diff 使用从 VS Code 提取的 `DefaultLinesDiffComputer`：较小输入使用带行权重的动态规划，较大输入使用 Myers，并执行 VS Code 的边界与短匹配启发式优化。
- 算法通过零运行时依赖的 `vscode-diff` 包引入，避免复制和自行维护 VS Code 的多模块实现；其 MIT 许可随扩展发布在 `THIRD_PARTY_NOTICES.md`。
- 单次 Diff 计算预算为 100ms；超时或算法异常时跳过结果，不展示可能错误的近似变更块。
- RPC revision 未变化时不重新传输 HEAD 内容。
- 同一文档首次超限只记录一次警告，避免日志刷屏。

`DefaultLinesDiffComputer` 返回原始与当前文档之间的半开行范围。每组范围首先转换成完整 `ChangeHunk`，包含原始和当前的起始行及双方完整行数组。同一 Hunk 再拆成装订线需要的轻量 `LineChange`；后者只保存 `hunkId`、变更类型和当前行范围：

- 成对行标记为 `modified`。
- 多出的新行标记为 `added`。
- 多出的旧行在当前文档对应锚点标记为 `deleted`。

换行统一为 LF 后比较，避免 CRLF/LF 造成整篇误报。Diff 前仍先剥离完全相同的公共前后缀，既减少主线程计算量，也让性能预算集中在真实变化区域。

保留完整 Hunk 而不是从装订线标记反推还原范围，可以保证不等长替换（例如两行替换三行）始终作为一个整体预览和还原。

### `decorations.ts` 与 `styles.ts`

渲染只消费统一的 `LineChange[]`，不关心基线如何取得。

Git 基线沿用常见语义：

- 绿色实线：新增。
- 蓝色实线：修改。
- 红色三角：删除。

Tab 基线沿用相同的新增、修改语义色，只改变纹理：

- 绿色点状线：新增。
- 蓝色点状线：修改。
- 紫色三角：删除。

手动基线属于非 Git 来源，沿用 Tab 基线的点状线和紫色删除三角，但悬浮提示明确显示“相对手动基线”。

颜色表达变更类型，线型和删除三角颜色表达基线来源；悬浮提示进一步说明“相对 HEAD”或“相对 Tab 打开时”。样式优先使用 Monaco 的 `editorGutter` 主题变量，并提供回退色。

鼠标悬浮时，新增/修改线从 4px 平滑增宽到 6px，并通过 margin 补偿保持视觉中心稳定；删除三角仅加宽箭头。变化只发生在 decoration 元素内部，不触发编辑器重新布局。

### `change-preview-widget.ts` 与 `restore-change.ts`

点击装订线后，`ChangePreviewWidget` 在用户实际点击行前插入 Monaco ViewZone：

- ViewZone 的界面锚点使用点击行，展示和还原的数据范围仍使用完整 Hunk。两者分离后，即使 Hunk 很大、用户点击靠下的标记，面板也不会被插入到视口之外的 Hunk 起始位置。该定位方式与 AI Copilot 按当前选区插入 ViewZone 的做法一致。

- 标题明确显示“相对 HEAD”或“相对 Tab 打开时”。
- 原始行以淡删除底色和 `-` 显示，当前行以新增色和 `+` 显示；删除正文底色只混入少量语义红色，避免大块变更时颜色过重。
- “还原此变更”“关闭”两个文字按钮位于左侧，“自动换行”紧随关闭按钮，随后依次是清空、刷新、文档历史三个图标按钮；基线来源描述位于右侧。刷新和历史使用 Yank Note `SvgIcon` 提供的 `sync-alt-solid`、`history-solid`。Yank Note 的内置图标同样来自 Font Awesome，但没有暴露扫帚，因此扩展内嵌 Font Awesome Free 7 的 `broom` solid SVG，并仍通过 `SvgIcon` 渲染；版权归属记录在 `THIRD_PARTY_NOTICES.md`，不引入整套图标依赖。按钮固定为紧凑字号和尺寸，不继承编辑器字号；头部左侧只保留 3px 内边距，让按钮组更靠近编辑区左沿。
- 单侧最多创建 100 个 DOM 行节点，超出时显示截断提示；内容区最多占 6 行高度，约为原方案的一半。
- 只有内容超过 6 行时才启用纵向滚动；可滚动区域消费 wheel 事件，防止 Monaco 编辑器抢走滚轮。
- ViewZone 的基础高度覆盖标题和可见正文行；非换行模式出现横向滚动条时，动态测量其实际占用高度并通过 `layoutZone` 补偿。自动换行时根据正文 `scrollHeight` 扩展到实际视觉行高度，但仍以 6 行为上限。切换换行或编辑器宽度变化时重新测量并收放，避免正文被滚动条裁切或留下多余空白。
- 同一时刻只保留一个 ViewZone，再次点击同一 Hunk 或点击关闭按钮会收起。
- 焦点位于 Monaco 或 ViewZone 内部控件时，`Esc` 都会关闭面板；从面板内部关闭时焦点返回编辑器。
- ViewZone 宽度显式同步到 Monaco 当前可视内容宽度，并用 `scrollLeft` 抵消内容层的水平位移；编辑器布局或横向滚动变化时同步更新，因此面板右侧始终保持在可视区内。
- “自动换行”默认关闭，只保存在 `ChangePreviewWidget` 实例内，不写设置或本地存储；打开后长行使用 `pre-wrap`，关闭时使用面板自身的横向滚动。
- 每行的 `+`/`-` 使用 `position: sticky` 固定在预览区左侧，横向滚动只移动代码正文；标记列使用对应的新增绿色或删除红色前景，与正文中的普通 `+`/`-` 字符区分。底色由不透明的编辑器面板底色混入少量语义色生成，右侧分隔线也只使用浅淡语义色，既避免滚动正文透出，也不会形成浓重色块。
- ViewZone 挂载后将 Monaco 生成的父层提升到 `z-index: 3`，与 AI Copilot、Renumber 扩展的既有做法一致，保证按钮位于编辑器文本层上方并能接收鼠标事件。

还原只操作当前 Hunk：

1. 校验 URI、Monaco model version 以及当前行内容仍与打开预览时一致。
2. 用 Hunk 的原始行替换其当前行，不触碰文档中的其他变更。
3. 通过 Monaco model 的 `getEOL()` 使用当前编辑器换行格式，并保留当前文档的末尾换行状态。
4. 计算还原前后文本的最小字符编辑，通过 `executeEdits()` 应用。
5. 编辑前后分别 `pushUndoStop()`，用户可以正常撤销还原。

任何内容变化、Tab/model 切换、窗口聚焦触发的 Git 刷新都会先关闭 ViewZone 并废弃旧映射，避免按过期行号还原。ViewZone 内所有文本均通过 `textContent` 写入，不解释文档中的 HTML。

“清除全部标记”与还原不同：它不编辑文档，而是把当前 Monaco 内容写入该 URI 的 manual 基线，立即清空 decorations，并让后续窗口聚焦、Tab 返回和普通输入都跳过 Git RPC。之后产生的新编辑仍会相对这一手动基线显示。

刷新图标用于显式恢复自动基线并重新计算：先将状态恢复为首次打开 Tab 时的基线并清除 Git 检查时间，再强制请求 Git。Git 可用时重新读取 HEAD；非 Git 或 Git 不可用时保留 Tab 基线；manual 状态也会由此退出。刷新不修改文档内容。

“文档历史”只复用 Yank Note 内置的 `doc.show-history` action。触发前关闭当前 ViewZone，不复制历史查询、权限或面板逻辑。

## 生命周期

### 首次进入 Tab

1. Monaco `onDidChangeModel` 触发。
2. 如果 URI 没有状态，只捕获当前内容作为 `tabContent` 和初始 Tab 基线。
3. 不执行 Git RPC。
4. 不计算 Diff，也不创建 decorations。

捕获快照本身是必要的轻量操作：如果等到第一次内容变化后再捕获，就会丢失真正的 Tab 打开内容。

### 切换回已有 Tab

URI 已有状态时视为返回已有 Tab：

1. 清除上一个 model 的 decorations 和待执行 timer。
2. 强制刷新 Git 基线。
3. 使用最新基线和当前 Monaco 内容计算 Diff。

Git 请求在切换离开后仍可完成并更新该 URI 的缓存；返回时只会渲染当前 URI，不会把异步结果画到错误 model。

### 编辑与保存

Monaco `onDidChangeModelContent` 在 120ms debounce 后触发一次评估，不修改 Tab 快照：

1. Git 从未检查或 `gitCheckedAt` 已超过 30 秒时刷新基线。
2. 首次 Git 请求尚未完成时暂不显示 Tab 装订线，避免随后瞬间从点状切换为实线。
3. 使用最新基线计算并渲染 Diff。

保存仅更新磁盘内容，因此 Git 和 Tab 标记都不会因为自动保存消失。

### 查看与还原

1. 用户点击本扩展的装订线标记。
2. Controller 按点击行定位 `LineChange`，再通过 `hunkId` 取得完整 `ChangeHunk`。
3. ViewZone 展示整个 Hunk，而不是只展示被拆分的某一种行标记。
4. 用户选择还原后，扩展执行一次最小 Monaco edit；随后正常的内容变化流程关闭面板并重新计算装订线。

还原语义完全由基线决定：Git 文件还原到 HEAD，Tab 基线文件还原到首次进入该 Tab 时的内容，manual 基线文件还原到最近一次“清除全部标记”时的内容。它不写 Git index，也不直接写磁盘；后续保存仍由 Yank Note 原有编辑流程负责。

如果选择“清除全部标记”，Controller 会先校验 URI 和 Monaco model version，再将完整当前内容设为 manual 基线并清空标记。该操作不进入撤销栈，因为它不修改文档内容。

### 提交或切换分支

应用窗口重新获得焦点时强制刷新 Git 元数据并计算 Diff。HEAD revision 未变则保留现有内容；revision 变化则读取新的 HEAD blob 并重新渲染。

如果同一 URI 已有 Git 请求进行中，不会再启动第二个请求。刷新完成后再使用最新基线渲染；第一次 Git 检查进行中时同样等待其完成。

### 关闭 Tab

监听 `store.state.tabs`，删除列表中已不存在的 URI。Yank Note 临时预览 Tab 被替换时也会自然清理。

## 失败与降级

| 情况 | 行为 |
|---|---|
| 普通 Git 文件 | HEAD 基线 |
| Git 未跟踪/新暂存文件 | 空 Git 基线 |
| Git 仓库无 commit | 空 Git 基线 |
| `.gitignore` 文件 | Tab 基线 |
| 非 Git 文件 | Tab 基线 |
| 加密文件 | Tab 明文基线 |
| Git 未安装或超时 | 保留已有基线；首次打开使用 Tab 基线 |
| 非分享模式但 RPC 无权限 | Tab 基线 |
| 分享模式 | 扩展不初始化 |
| 非默认编辑器 | 不显示 |
| 非 plain 文件 | 不显示 |
| 文件不可写或应用全局只读 | 不显示 |
| Diff 超过性能预算 | 清除标记并记录一次警告 |

## 测试策略

单元测试覆盖以下纯边界：

- Git RPC：使用假的 `child_process.execFile`，不依赖机器安装 Git。
- Diff：新增、修改、删除、不同行数、重复行稳定对齐、CRLF 和性能上限。
- 还原：新增/删除/修改、文件边界、末尾换行、CRLF、过期 Hunk 拒绝和只还原单个 Hunk。
- 基线状态：Tab 保留、Git 替换、Git 消失回退、检查有效期、pending 去重和关闭 Tab 清理。
- 手动基线：立即替换、阻止后续 Git 检查以及拒绝在途 Git 结果覆盖。
- Decoration：来源、变更类型、行范围和提示文案。

不在单测中启动 Yank Note，也不依赖真实 Monaco DOM。

## 后续扩展点

如果以后需要上下一个变更导航或更丰富的语法高亮，可以继续消费 `ChangeHunk[]`，不需要改变基线获取和还原模型。Git 暂存应作为独立能力设计，不在装订线展示层直接调用。
