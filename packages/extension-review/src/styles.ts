export const reviewStyles = `
.markdown-view .markdown-body .custom-container.section[id^="yn-review-"] {
  position: relative;
  padding-top: 12px;
  border-color: light-dark(#a8d9d4, #376d68);
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container-title {
  box-sizing: border-box;
  min-height: 20px;
  padding-right: 86px;
  font-size: 14px;
  line-height: 20px;
}

.markdown-view .markdown-body .custom-container.section[id^="yn-review-"].yn-review-unresolved {
  border-color: #d68b00;
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container-title > .yn-review-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 5px;
  color: #b56b00;
  vertical-align: -2px;
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container-title > .yn-review-status .yn-review-icon {
  width: 13px;
  height: 13px;
}

.markdown-view .markdown-body .yn-review-prefix,
.markdown-view .markdown-body .yn-review-suffix {
  opacity: .72;
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container.details {
  margin: 4px 0 12px;
  padding: 4px 10px;
  background-color: var(--g-color-95);
}

.markdown-view .markdown-body .yn-review-context-summary {
  display: list-item;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container.tip {
  margin: 12px 0 0;
  padding: 4px 10px;
  border-left-width: 4px;
  border-left-color: light-dark(#159a98, #5eead4);
  border-radius: var(--g-border-radius);
  background-color: var(--g-color-95);
  color: var(--g-color-10);
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container.tip > p:last-child {
  margin-bottom: 0;
}

.markdown-view .markdown-body [id^="yn-review-"] > .custom-container.details > blockquote {
  margin: 0;
}

.markdown-view .markdown-body .yn-review-exact,
.markdown-view .markdown-body .yn-review-head,
.markdown-view .markdown-body .yn-review-tail {
  border-left-color: light-dark(#159a98, #5eead4);
  background: light-dark(rgba(45, 212, 191, .16), rgba(45, 212, 191, .10));
  color: light-dark(#063f3d, #eafffc);
}

.markdown-view .markdown-body .yn-review-omitted {
  text-align: center;
  opacity: .65;
}

.yn-review-actions {
  position: absolute;
  top: 9px;
  right: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
}

.yn-review-icon {
  display: block;
  width: 14px;
  height: 14px;
}

.yn-review-icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.yn-review-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--g-color-35);
  cursor: default;
  opacity: 0;
  pointer-events: none;
  transition: opacity .12s ease, background-color .12s ease, color .12s ease;
}

.markdown-view .markdown-body .custom-container.section[id^="yn-review-"]:hover > .yn-review-actions button,
.yn-review-actions button:focus-visible,
.yn-review-actions button.yn-review-delete-armed {
  opacity: 1;
  pointer-events: auto;
}

.yn-review-actions button:hover {
  background: var(--g-color-86);
  color: var(--g-color-0);
}

.yn-review-actions button.yn-review-delete-armed,
.yn-review-actions button.yn-review-delete-armed:hover {
  width: auto;
  gap: 5px;
  padding: 0 8px 0 6px;
  border-radius: var(--g-border-radius);
  background: #d74343;
  color: white;
}

.yn-review-actions.yn-review-delete-confirming > button:not(.yn-review-delete-armed) {
  display: none;
}

.yn-review-delete-label {
  font-size: 12px;
  line-height: 26px;
  white-space: nowrap;
}

.yn-review-floating-button {
  position: absolute;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid light-dark(#b8e7e2, #3a6664);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .18);
  background: light-dark(#e7faf7, #213f3f);
  color: light-dark(#168b84, #75e3d5);
  cursor: default;
}

.yn-review-floating-button:hover {
  background: light-dark(#d4f5ef, #2b504e);
}

.yn-review-composer {
  position: absolute;
  z-index: 2147483001;
  width: min(360px, calc(100vw - 24px));
  box-sizing: border-box;
  padding: 6px;
  border: 1px solid var(--g-color-84);
  border-radius: var(--g-border-radius);
  background: color-mix(in srgb, var(--g-color-backdrop) 97%, #2dd4bf 3%);
  backdrop-filter: var(--g-backdrop-filter);
  box-shadow: rgba(0, 0, 0, .3) 2px 2px 10px;
  color: var(--g-color-10);
  font-family: system-ui, sans-serif;
}

.yn-review-composer-title {
  min-height: 20px;
  box-sizing: border-box;
  padding: 2px 26px 5px 3px;
  color: var(--g-color-30);
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
}

.yn-review-composer-input {
  position: relative;
}

.yn-review-composer textarea {
  min-height: 88px;
  resize: none;
  padding-right: 2em;
  padding-bottom: 30px;
  background: rgba(var(--g-color-0-rgb), .06);
  font: 13px/1.5 system-ui, sans-serif;
}

.yn-review-composer textarea:focus {
  background: rgba(var(--g-color-0-rgb), .06);
}

.yn-review-composer-icon-button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  margin: 0;
  padding: 4px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--g-color-30);
  cursor: default;
}

.yn-review-composer-icon-button:hover {
  background: var(--g-color-80);
  color: var(--g-color-0);
}

.yn-review-composer-close {
  top: 4px;
  right: 4px;
}

.yn-review-composer-send {
  top: auto;
  right: 10px;
  bottom: 6px;
  padding: 0;
  color: var(--g-color-30);
}

.yn-review-composer-send > .yn-review-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.yn-review-composer-send > .yn-review-icon svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
  stroke: none;
  transform: translate(-1px, -1px);
}

.yn-review-composer-send:hover {
  background: var(--g-color-75);
  color: var(--g-color-0);
}
`
