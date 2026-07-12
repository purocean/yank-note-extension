export const changeGutterStyles = `
  :root {
    --yn-change-gutter-tab: #8250df;
  }

  html[app-theme="dark"] {
    --yn-change-gutter-tab: #bc8cff;
  }

  @media (prefers-color-scheme: dark) {
    html[app-theme="system"] {
      --yn-change-gutter-tab: #bc8cff;
    }
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter {
    box-sizing: border-box;
    width: 4px !important;
    margin-left: 3px;
    cursor: pointer;
    transition: width 80ms ease, margin-left 80ms ease;
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter:hover {
    width: 6px !important;
    margin-left: 2px;
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-git-added {
    background: var(--vscode-editorGutter-addedBackground, #2da44e);
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-git-modified {
    background: var(--vscode-editorGutter-modifiedBackground, #0969da);
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-added,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-added {
    background: repeating-linear-gradient(
      to bottom,
      var(--vscode-editorGutter-addedBackground, #2da44e) 0,
      var(--vscode-editorGutter-addedBackground, #2da44e) 3px,
      transparent 3px,
      transparent 5px
    );
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-modified,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-modified {
    background: repeating-linear-gradient(
      to bottom,
      var(--vscode-editorGutter-modifiedBackground, #0969da) 0,
      var(--vscode-editorGutter-modifiedBackground, #0969da) 3px,
      transparent 3px,
      transparent 5px
    );
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-git-deleted,
  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-deleted,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-deleted {
    position: relative;
    width: 6px !important;
    margin-left: 2px;
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-git-deleted::after,
  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-deleted::after,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-deleted::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 0;
    height: 0;
    transform: translateY(-50%);
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 5px solid var(--vscode-editorGutter-deletedBackground, #cf222e);
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-deleted::after,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-deleted::after {
    border-left-color: var(--yn-change-gutter-tab);
  }

  .monaco-editor .margin-view-overlays .yn-change-gutter-git-deleted:hover::after,
  .monaco-editor .margin-view-overlays .yn-change-gutter-tab-deleted:hover::after,
  .monaco-editor .margin-view-overlays .yn-change-gutter-manual-deleted:hover::after {
    border-left-width: 7px;
  }

  .yn-change-gutter-preview {
    box-sizing: border-box;
    position: relative;
    z-index: 3;
    max-width: 100%;
    height: 100%;
    color: var(--vscode-editorWidget-foreground, inherit);
    background: var(--vscode-editorWidget-background, var(--yn-bg-color, #fff));
    border: 1px solid var(--vscode-editorWidget-border, rgba(127, 127, 127, .35));
    overflow: hidden;
  }

  .yn-change-gutter-preview-header {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
    padding: 0 8px 0 3px;
    border-bottom: 1px solid var(--vscode-editorWidget-border, rgba(127, 127, 127, .25));
  }

  .yn-change-gutter-preview-title {
    min-width: 0;
    margin-left: auto;
    color: var(--vscode-descriptionForeground, inherit);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .yn-change-gutter-preview-actions {
    display: flex;
    flex: none;
    gap: 4px;
  }

  .yn-change-gutter-preview-word-wrap {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 3px;
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }

  .yn-change-gutter-preview-word-wrap input {
    width: 13px;
    height: 13px;
    margin: 0;
  }

  .yn-change-gutter-preview-button {
    box-sizing: border-box;
    height: 22px;
    padding: 0 8px;
    color: var(--vscode-button-secondaryForeground, #fff);
    background: var(--vscode-button-secondaryBackground, #5f6b7a);
    border: 0;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    cursor: pointer;
  }

  .yn-change-gutter-preview-button:hover {
    background: var(--vscode-button-secondaryHoverBackground, #6f7b8a);
  }

  .yn-change-gutter-preview-restore {
    color: var(--vscode-button-foreground, #fff);
    background: var(--vscode-button-background, #0e639c);
  }

  .yn-change-gutter-preview-restore:hover {
    background: var(--vscode-button-hoverBackground, #1177bb);
  }

  .yn-change-gutter-preview-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    padding: 0;
    color: var(--vscode-icon-foreground, var(--vscode-editorWidget-foreground, inherit));
    background: transparent;
    border: 1px solid transparent;
  }

  .yn-change-gutter-preview-icon-button:hover {
    color: var(--vscode-toolbar-hoverForeground, var(--vscode-editorWidget-foreground, inherit));
    background: var(--vscode-toolbar-hoverBackground, rgba(127, 127, 127, .16));
    border-color: var(--vscode-toolbar-hoverOutline, transparent);
  }

  .yn-change-gutter-preview-icon {
    display: inline-flex;
    width: 12px;
    height: 12px;
    pointer-events: none;
  }

  .yn-change-gutter-preview-body {
    box-sizing: border-box;
    height: calc(100% - 30px);
    overflow-x: auto;
    overflow-y: hidden;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    line-height: 20px;
  }

  .yn-change-gutter-preview-body-scrollable {
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .yn-change-gutter-preview-body-word-wrap {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .yn-change-gutter-preview-body-word-wrap .yn-change-gutter-preview-line {
    min-width: 0;
    white-space: pre-wrap;
  }

  .yn-change-gutter-preview-body-word-wrap .yn-change-gutter-preview-code {
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }

  .yn-change-gutter-preview-line {
    display: flex;
    min-width: max-content;
    white-space: pre;
  }

  .yn-change-gutter-preview-line-removed {
    background: rgba(207, 34, 46, .06);
    background: color-mix(
      in srgb,
      var(--vscode-editorWidget-background, var(--yn-bg-color, #fff)) 96%,
      var(--vscode-editorGutter-deletedBackground, #cf222e) 4%
    );
  }

  .yn-change-gutter-preview-line-added {
    background: var(--vscode-diffEditor-insertedLineBackground, rgba(0, 255, 0, .10));
  }

  .yn-change-gutter-preview-marker {
    box-sizing: border-box;
    position: sticky;
    left: 0;
    z-index: 1;
    width: 28px;
    padding-right: 8px;
    flex: none;
    text-align: right;
    font-weight: 600;
    user-select: none;
  }

  .yn-change-gutter-preview-line-removed .yn-change-gutter-preview-marker {
    color: var(--vscode-gitDecoration-deletedResourceForeground, #b94a48);
    background: var(--vscode-editorWidget-background, var(--yn-bg-color, #fff));
    background: color-mix(
      in srgb,
      var(--vscode-editorWidget-background, var(--yn-bg-color, #fff)) 94%,
      var(--vscode-editorGutter-deletedBackground, #cf222e) 6%
    );
    border-right: 1px solid var(--vscode-editorWidget-border, #ddd);
    border-right-color: color-mix(
      in srgb,
      var(--vscode-editorWidget-background, var(--yn-bg-color, #fff)) 84%,
      var(--vscode-editorGutter-deletedBackground, #cf222e) 16%
    );
  }

  .yn-change-gutter-preview-line-added .yn-change-gutter-preview-marker {
    color: var(--vscode-editorGutter-addedBackground, #2ea043);
    background: var(--vscode-editorWidget-background, var(--yn-bg-color, #fff));
    background: color-mix(
      in srgb,
      var(--vscode-editorWidget-background, var(--yn-bg-color, #fff)) 92%,
      var(--vscode-editorGutter-addedBackground, #2ea043) 8%
    );
    border-right: 1px solid var(--vscode-editorWidget-border, #ddd);
    border-right-color: color-mix(
      in srgb,
      var(--vscode-editorWidget-background, var(--yn-bg-color, #fff)) 84%,
      var(--vscode-editorGutter-addedBackground, #2ea043) 16%
    );
  }

  .yn-change-gutter-preview-code {
    padding-left: 8px;
    padding-right: 12px;
  }

  .yn-change-gutter-preview-truncated {
    padding-left: 12px;
    opacity: .7;
  }
`
