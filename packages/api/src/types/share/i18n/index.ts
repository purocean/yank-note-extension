import { BaseLanguage } from './languages/en';
declare const languages: {
    en: {
        'app-name': string;
        about: string;
        feedback: string;
        slogan: string;
        cancel: string;
        undo: string;
        ok: string;
        'demo-tips': string;
        more: string;
        copied: string;
        'insert-different-repo-doc': string;
        'need-clipboard-permission': string;
        'click-to-copy': string;
        'click-to-copy-link': string;
        'copy-code': string;
        loading: string;
        'add-image': string;
        'upload-image': string;
        'exit-presentation-msg': string;
        reload: string;
        'open-in-new-window': string;
        'view-figure': string;
        export: string;
        'no-password': string;
        save: string;
        close: string;
        discard: string;
        edit: string;
        outline: string;
        files: string;
        'install-extension-tips': string;
        'not-support-mas': string;
        'learn-more': string;
        default: string;
        print: string;
        premium: {
            'need-purchase': string;
            'buy-license': string;
            free: string;
            premium: string;
            upgrade: string;
            intro: {
                intro: string;
                'current-plan': string;
                included: string;
                desc: string;
                'free-desc': string;
                'premium-desc': string;
                'free-list': string;
                'premium-list': string;
            };
            buy: {
                buy: string;
            };
            activation: {
                license: string;
                activation: string;
                placeholder: string;
                'get-license': string;
                info: string;
                expired: string;
                expiring: string;
                'need-refresh': string;
                refresh: string;
                renewal: string;
                devices: string;
                'this-machine': string;
                unbind: string;
                'unbind-confirm': string;
                name: string;
                email: string;
                expires: string;
                plan: string;
                success: string;
                activating: string;
                tips: string;
                'tips-wechat': string;
                'activation-tips': string;
            };
        };
        app: {
            quit: string;
            preferences: string;
            'close-window': string;
            'toggle-fullscreen': string;
            tray: {
                'open-main-window': string;
                'open-in-browser': string;
                'open-main-dir': string;
                preferences: string;
                'start-at-login': string;
                version: string;
                quit: string;
                dev: {
                    dev: string;
                    'port-prod': string;
                    'port-dev': string;
                    reload: string;
                    'dev-tool': string;
                    restart: string;
                    'force-quit': string;
                };
            };
            updater: {
                'found-dialog': {
                    title: string;
                    desc: string;
                    buttons: {
                        download: string;
                        'view-changes': string;
                        'download-and-view-changes': string;
                        cancel: string;
                        ignore: string;
                    };
                };
                'progress-bar': {
                    title: string;
                    detail: string;
                    failed: string;
                };
                'failed-dialog': {
                    title: string;
                };
                'install-dialog': {
                    title: string;
                    desc: string;
                    buttons: {
                        install: string;
                        delay: string;
                    };
                };
                'no-newer-dialog': {
                    title: string;
                    desc: string;
                };
            };
            error: {
                EADDRINUSE: string;
            };
        };
        'quit-check-dialog': {
            title: string;
            desc: string;
            buttons: {
                cancel: string;
                discard: string;
            };
        };
        'save-check-dialog': {
            title: string;
            desc: string;
        };
        'change-setting-reload-main-widow-dialog': {
            title: string;
            desc: string;
        };
        'file-status': {
            unsaved: string;
            saving: string;
            saved: string;
            'save-failed': string;
            loaded: string;
            loading: string;
            'no-file': string;
        };
        modal: {
            info: string;
            'input-placeholder': string;
        };
        document: {
            'current-path': string;
            'password-create': string;
            'password-save': string;
            'password-open': string;
            'wrong-password': string;
            'file-transform-error': string;
            'create-dialog': {
                title: string;
                hint: string;
            };
            'create-dir-dialog': {
                title: string;
                hint: string;
            };
            'duplicate-dialog': {
                title: string;
                hint: string;
            };
            'delete-dialog': {
                title: string;
                content: string;
            };
            'move-dialog': {
                title: string;
                content: string;
            };
            'save-encrypted-file-dialog': {
                title: string;
                content: string;
            };
        };
        'status-bar': {
            view: {
                view: string;
                xterm: string;
                preview: string;
                editor: string;
                'side-bar': string;
                'word-wrap': string;
                'typewriter-mode': string;
                'editor-preview-exclusive': string;
            };
            setting: string;
            repo: {
                repo: string;
                'no-data': string;
            };
            nav: {
                nav: string;
                goto: string;
                forward: string;
                back: string;
            };
            insert: {
                insert: string;
                'paste-rt': string;
                'paste-img-base64': string;
            };
            tool: {
                tool: string;
                'convert-img-link': string;
                'macro-copy-markdown': string;
                'copy-content': string;
                'doc-history': string;
                'share-preview': string;
                print: string;
                export: string;
            };
            'document-info': {
                selected: string;
                lines: string;
                chars: string;
                selections: string;
            };
            help: {
                help: string;
                readme: string;
                features: string;
                shortcuts: string;
                plugin: string;
            };
            terminal: string;
            present: string;
            get: {
                'get-application': string;
            };
            extension: {
                'extension-manager': string;
            };
            theme: {
                tips: string;
                dark: string;
                light: string;
                system: string;
            };
        };
        view: {
            outline: string;
            print: string;
        };
        tree: {
            'db-click-refresh': string;
            'add-repo': string;
            'add-repo-hint': string;
            'created-at': string;
            'updated-at': string;
            'context-menu': {
                mark: string;
                unmark: string;
                duplicate: string;
                'create-doc': string;
                'create-dir': string;
                rename: string;
                delete: string;
                'open-in-os': string;
                'reveal-in-os': string;
                refresh: string;
                'open-in-terminal': string;
                'create-in-cd': string;
                'copy-name': string;
                'copy-path': string;
                'find-in-folder': string;
            };
            toast: {
                moved: string;
                copied: string;
            };
            sort: {
                asc: string;
                desc: string;
                'by-name': string;
                'by-mtime': string;
                'by-birthtime': string;
                'by-serial': string;
            };
        };
        tabs: {
            'close-others': string;
            'close-right': string;
            'close-left': string;
            'close-all': string;
            pin: string;
            unpin: string;
            'search-tabs': string;
            'new-tab': string;
        };
        'export-panel': {
            export: string;
            format: string;
            pdf: {
                orientation: string;
                portrait: string;
                landscape: string;
                size: string;
                zoom: string;
                'use-browser': string;
                'include-bg': string;
            };
            'use-html': string;
            'use-markdown': string;
            loading: string;
        };
        'title-bar': {
            pin: string;
            minimize: string;
            unmaximize: string;
            maximize: string;
        };
        'setting-panel': {
            setting: string;
            add: string;
            'delete-warning': string;
            'error-choose-repo-path': string;
            'keep-running-after-closing-window': string;
            tabs: {
                repos: string;
                appearance: string;
                editor: string;
                render: string;
                image: string;
                proxy: string;
                macros: string;
                other: string;
            };
            schema: {
                repos: {
                    repos: string;
                    repo: string;
                    name: string;
                    'name-placeholder': string;
                    path: string;
                    'path-placeholder': string;
                };
                editor: {
                    'mouse-wheel-zoom': string;
                    'font-size': string;
                    'tab-size': string;
                    'ordered-list-completion': string;
                    minimap: string;
                    'line-numbers': string;
                    'enable-preview': string;
                    'font-family': string;
                    'complete-emoji': string;
                };
                render: {
                    'md-html': string;
                    'md-breaks': string;
                    'md-linkify': string;
                    'md-typographer': string;
                    'md-sup': string;
                    'md-sub': string;
                    'md-emoji': string;
                };
                theme: string;
                language: string;
                'custom-css': string;
                'assets-dir': string;
                'assets-desc': string;
                assets: {
                    'path-type': string;
                };
                shell: string;
                envs: string;
                'auto-save': string;
                'plantuml-api': string;
                updater: {
                    source: string;
                };
                'doc-history': {
                    'number-limit': string;
                };
                search: {
                    'number-limit': string;
                };
                server: {
                    host: string;
                    port: string;
                    'port-desc': string;
                };
                tree: {
                    exclude: string;
                };
                proxy: {
                    enabled: string;
                    server: string;
                    'server-hint': string;
                    'bypass-list': string;
                    'pac-url': string;
                };
                macros: {
                    macros: string;
                    match: string;
                    replace: string;
                    'match-placeholder': string;
                    'replace-placeholder': string;
                };
            };
        };
        'quick-open': {
            'input-placeholder': string;
            empty: string;
            files: string;
            marked: string;
        };
        editor: {
            'context-menu': {
                'paste-image': string;
                'paste-image-as-base64': string;
                'paste-rt-as-markdown': string;
                'add-attachment': string;
                'link-doc': string;
                'link-file': string;
                'insert-date': string;
                'insert-time': string;
                'reveal-line-in-preview': string;
            };
            'switch-editor': string;
            'default-editor': string;
        };
        previewer: {
            'default-previewer': string;
            'switch-previewer': string;
        };
        picgo: {
            setting: {
                'api-title': string;
                'api-desc': string;
                'api-msg': string;
                'paste-title': string;
            };
            uploading: string;
            'upload-failed': string;
            'need-api': string;
            'upload-all-images': string;
        };
        'code-run': {
            run: string;
            'run-in-xterm-tips': string;
            'run-in-xterm': string;
            running: string;
            clear: string;
        };
        'mind-map': {
            'zoom-in': string;
            'zoom-out': string;
            'fit-height': string;
            'switch-layout': string;
            'switch-loose': string;
            'convert-error': string;
        };
        'table-cell-edit': {
            'esc-to-cancel': string;
            'db-click-edit': string;
            canceled: string;
            'edit-hint': string;
            'edit-title': string;
            'edit-error': string;
            'limit-single-line': string;
            'context-menu': {
                edit: string;
                'quick-edit': string;
                'sort-mode': string;
                'sort-asc': string;
                'sort-desc': string;
                'align-left': string;
                'align-center': string;
                'align-right': string;
                'align-normal': string;
                'add-row-above': string;
                'add-row-below': string;
                'delete-row': string;
                'add-col-left': string;
                'add-col-right': string;
                'delete-col': string;
            };
        };
        'markdown-link': {
            'convert-to-titled-link': string;
        };
        'custom-css': {
            'change-confirm': {
                title: string;
                content: string;
            };
        };
        'control-center': {
            'control-center': string;
            switch: {
                'side-bar': string;
                editor: string;
                view: string;
                'sync-scroll': string;
                'sync-rendering': string;
                'word-wrap': string;
                'typewriter-mode': string;
            };
            navigation: {
                goto: string;
                forward: string;
                back: string;
                refresh: string;
            };
        };
        'doc-history': {
            clear: string;
            'apply-version': string;
            'no-history': string;
            content: string;
            diff: string;
            history: string;
            current: string;
            all: string;
            marked: string;
            mark: string;
            unmark: string;
            delete: string;
            'edit-message': string;
            'delete-dialog': {
                title: string;
                content: string;
            };
            'clear-dialog': {
                title: string;
                content: string;
            };
            'mark-dialog': {
                title: string;
                hint: string;
            };
            'content-too-long-alert': {
                title: string;
                content: string;
            };
        };
        'copy-content': {
            options: string;
            type: string;
            'inline-style': string;
            'include-style': string;
            'inline-image': string;
            'upload-image': string;
            'highlight-code': string;
            rt: string;
            complete: string;
            'copy-tips': string;
            'copy-tips-selected': string;
        };
        'share-preview': {
            expire: string;
            tips: string;
        };
        'electron-zoom': {
            'zoom-in': string;
            'zoom-out': string;
            'zoom-reset': string;
        };
        extension: {
            'extension-manager': string;
            all: string;
            installed: string;
            official: string;
            unofficial: string;
            unknown: string;
            author: string;
            origin: string;
            'unpacked-size': string;
            'latest-version': string;
            'installed-version': string;
            homepage: string;
            download: string;
            'toast-loaded': string;
            upgradable: string;
            incompatible: string;
            'not-installed': string;
            enabled: string;
            disabled: string;
            'reload-required': string;
            'no-extension': string;
            reload: string;
            install: string;
            uninstall: string;
            installing: string;
            uninstalling: string;
            upgrade: string;
            disable: string;
            enable: string;
            'uninstall-confirm': string;
            registry: string;
            'activation-time': string;
            requirement: string;
            'auto-upgrade': string;
            'unknown-origin-tips': string;
            'extensions-auto-upgraded': string;
            'fetch-registry-failed': string;
        };
        'get-started': {
            'get-started': string;
            start: string;
            help: string;
            recent: string;
        };
        'search-panel': {
            'search-files': string;
            'placeholder-search': string;
            'for-history': string;
            'files-to-include': string;
            'files-to-exclude': string;
            'match-case': string;
            'match-whole-word': string;
            'use-regex': string;
            'expand-all': string;
            'collapse-all': string;
        };
        'file-changed-alert': {
            title: string;
            content: string;
            reload: string;
        };
    };
    'zh-CN': {
        'app-name': string;
        about: string;
        feedback: string;
        slogan: string;
        cancel: string;
        undo: string;
        ok: string;
        'demo-tips': string;
        more: string;
        copied: string;
        'insert-different-repo-doc': string;
        'need-clipboard-permission': string;
        'click-to-copy': string;
        'click-to-copy-link': string;
        'copy-code': string;
        loading: string;
        'add-image': string;
        'upload-image': string;
        'exit-presentation-msg': string;
        reload: string;
        'open-in-new-window': string;
        'view-figure': string;
        export: string;
        'no-password': string;
        save: string;
        close: string;
        discard: string;
        edit: string;
        outline: string;
        files: string;
        'install-extension-tips': string;
        'not-support-mas': string;
        'learn-more': string;
        default: string;
        print: string;
        premium: {
            'need-purchase': string;
            'buy-license': string;
            free: string;
            premium: string;
            upgrade: string;
            intro: {
                intro: string;
                'current-plan': string;
                included: string;
                desc: string;
                'free-desc': string;
                'premium-desc': string;
                'free-list': string;
                'premium-list': string;
            };
            buy: {
                buy: string;
            };
            activation: {
                license: string;
                activation: string;
                placeholder: string;
                'get-license': string;
                info: string;
                expired: string;
                expiring: string;
                'need-refresh': string;
                refresh: string;
                renewal: string;
                devices: string;
                'this-machine': string;
                unbind: string;
                'unbind-confirm': string;
                name: string;
                email: string;
                expires: string;
                plan: string;
                success: string;
                activating: string;
                tips: string;
                'tips-wechat': string;
                'activation-tips': string;
            };
        };
        app: {
            quit: string;
            preferences: string;
            'close-window': string;
            'toggle-fullscreen': string;
            tray: {
                'open-main-window': string;
                'open-in-browser': string;
                'open-main-dir': string;
                preferences: string;
                'start-at-login': string;
                version: string;
                quit: string;
                dev: {
                    dev: string;
                    'port-prod': string;
                    'port-dev': string;
                    reload: string;
                    'dev-tool': string;
                    restart: string;
                    'force-quit': string;
                };
            };
            updater: {
                'found-dialog': {
                    title: string;
                    desc: string;
                    buttons: {
                        download: string;
                        'view-changes': string;
                        'download-and-view-changes': string;
                        cancel: string;
                        ignore: string;
                    };
                };
                'progress-bar': {
                    title: string;
                    detail: string;
                    failed: string;
                };
                'failed-dialog': {
                    title: string;
                };
                'install-dialog': {
                    title: string;
                    desc: string;
                    buttons: {
                        install: string;
                        delay: string;
                    };
                };
                'no-newer-dialog': {
                    title: string;
                    desc: string;
                };
            };
            error: {
                EADDRINUSE: string;
            };
        };
        'quit-check-dialog': {
            title: string;
            desc: string;
            buttons: {
                cancel: string;
                discard: string;
            };
        };
        'save-check-dialog': {
            title: string;
            desc: string;
        };
        'change-setting-reload-main-widow-dialog': {
            title: string;
            desc: string;
        };
        'file-status': {
            unsaved: string;
            saving: string;
            saved: string;
            'save-failed': string;
            loaded: string;
            loading: string;
            'no-file': string;
        };
        modal: {
            info: string;
            'input-placeholder': string;
        };
        document: {
            'current-path': string;
            'password-create': string;
            'password-save': string;
            'password-open': string;
            'wrong-password': string;
            'file-transform-error': string;
            'create-dialog': {
                title: string;
                hint: string;
            };
            'create-dir-dialog': {
                title: string;
                hint: string;
            };
            'duplicate-dialog': {
                title: string;
                hint: string;
            };
            'delete-dialog': {
                title: string;
                content: string;
            };
            'move-dialog': {
                title: string;
                content: string;
            };
            'save-encrypted-file-dialog': {
                title: string;
                content: string;
            };
        };
        'status-bar': {
            view: {
                view: string;
                xterm: string;
                preview: string;
                editor: string;
                'side-bar': string;
                'word-wrap': string;
                'typewriter-mode': string;
                'editor-preview-exclusive': string;
            };
            setting: string;
            repo: {
                repo: string;
                'no-data': string;
            };
            nav: {
                nav: string;
                goto: string;
                forward: string;
                back: string;
            };
            insert: {
                insert: string;
                'paste-rt': string;
                'paste-img-base64': string;
            };
            tool: {
                tool: string;
                'convert-img-link': string;
                'macro-copy-markdown': string;
                'copy-content': string;
                'doc-history': string;
                'share-preview': string;
                print: string;
                export: string;
            };
            'document-info': {
                selected: string;
                lines: string;
                chars: string;
                selections: string;
            };
            help: {
                help: string;
                readme: string;
                features: string;
                shortcuts: string;
                plugin: string;
            };
            terminal: string;
            present: string;
            get: {
                'get-application': string;
            };
            extension: {
                'extension-manager': string;
            };
            theme: {
                tips: string;
                dark: string;
                light: string;
                system: string;
            };
        };
        view: {
            outline: string;
            print: string;
        };
        tree: {
            'db-click-refresh': string;
            'add-repo': string;
            'add-repo-hint': string;
            'created-at': string;
            'updated-at': string;
            'context-menu': {
                mark: string;
                unmark: string;
                duplicate: string;
                'create-doc': string;
                'create-dir': string;
                rename: string;
                delete: string;
                'open-in-os': string;
                'reveal-in-os': string;
                refresh: string;
                'open-in-terminal': string;
                'create-in-cd': string;
                'copy-name': string;
                'copy-path': string;
                'find-in-folder': string;
            };
            toast: {
                moved: string;
                copied: string;
            };
            sort: {
                asc: string;
                desc: string;
                'by-name': string;
                'by-mtime': string;
                'by-birthtime': string;
                'by-serial': string;
            };
        };
        tabs: {
            'close-others': string;
            'close-right': string;
            'close-left': string;
            'close-all': string;
            pin: string;
            unpin: string;
            'search-tabs': string;
            'new-tab': string;
        };
        'export-panel': {
            export: string;
            format: string;
            pdf: {
                orientation: string;
                portrait: string;
                landscape: string;
                size: string;
                zoom: string;
                'use-browser': string;
                'include-bg': string;
            };
            'use-html': string;
            'use-markdown': string;
            loading: string;
        };
        'title-bar': {
            pin: string;
            minimize: string;
            unmaximize: string;
            maximize: string;
        };
        'setting-panel': {
            setting: string;
            add: string;
            'delete-warning': string;
            'error-choose-repo-path': string;
            'keep-running-after-closing-window': string;
            tabs: {
                repos: string;
                appearance: string;
                editor: string;
                render: string;
                image: string;
                proxy: string;
                macros: string;
                other: string;
            };
            schema: {
                repos: {
                    repos: string;
                    repo: string;
                    name: string;
                    'name-placeholder': string;
                    path: string;
                    'path-placeholder': string;
                };
                editor: {
                    'mouse-wheel-zoom': string;
                    'font-size': string;
                    'tab-size': string;
                    'ordered-list-completion': string;
                    minimap: string;
                    'line-numbers': string;
                    'enable-preview': string;
                    'font-family': string;
                    'complete-emoji': string;
                };
                render: {
                    'md-html': string;
                    'md-breaks': string;
                    'md-linkify': string;
                    'md-typographer': string;
                    'md-sup': string;
                    'md-sub': string;
                    'md-emoji': string;
                };
                theme: string;
                language: string;
                'custom-css': string;
                'assets-dir': string;
                'assets-desc': string;
                assets: {
                    'path-type': string;
                };
                shell: string;
                envs: string;
                'auto-save': string;
                'plantuml-api': string;
                updater: {
                    source: string;
                };
                'doc-history': {
                    'number-limit': string;
                };
                search: {
                    'number-limit': string;
                };
                server: {
                    host: string;
                    port: string;
                    'port-desc': string;
                };
                tree: {
                    exclude: string;
                };
                proxy: {
                    enabled: string;
                    server: string;
                    'server-hint': string;
                    'bypass-list': string;
                    'pac-url': string;
                };
                macros: {
                    macros: string;
                    match: string;
                    replace: string;
                    'match-placeholder': string;
                    'replace-placeholder': string;
                };
            };
        };
        'quick-open': {
            'input-placeholder': string;
            empty: string;
            files: string;
            marked: string;
        };
        editor: {
            'context-menu': {
                'paste-image': string;
                'paste-image-as-base64': string;
                'paste-rt-as-markdown': string;
                'add-attachment': string;
                'link-doc': string;
                'link-file': string;
                'insert-date': string;
                'insert-time': string;
                'reveal-line-in-preview': string;
            };
            'switch-editor': string;
            'default-editor': string;
        };
        previewer: {
            'default-previewer': string;
            'switch-previewer': string;
        };
        picgo: {
            setting: {
                'api-title': string;
                'api-desc': string;
                'api-msg': string;
                'paste-title': string;
            };
            uploading: string;
            'upload-failed': string;
            'need-api': string;
            'upload-all-images': string;
        };
        'code-run': {
            run: string;
            'run-in-xterm-tips': string;
            'run-in-xterm': string;
            running: string;
            clear: string;
        };
        'mind-map': {
            'zoom-in': string;
            'zoom-out': string;
            'fit-height': string;
            'switch-layout': string;
            'switch-loose': string;
            'convert-error': string;
        };
        'table-cell-edit': {
            'esc-to-cancel': string;
            'db-click-edit': string;
            canceled: string;
            'edit-hint': string;
            'edit-title': string;
            'edit-error': string;
            'limit-single-line': string;
            'context-menu': {
                edit: string;
                'quick-edit': string;
                'sort-mode': string;
                'sort-asc': string;
                'sort-desc': string;
                'align-left': string;
                'align-center': string;
                'align-right': string;
                'align-normal': string;
                'add-row-above': string;
                'add-row-below': string;
                'delete-row': string;
                'add-col-left': string;
                'add-col-right': string;
                'delete-col': string;
            };
        };
        'markdown-link': {
            'convert-to-titled-link': string;
        };
        'custom-css': {
            'change-confirm': {
                title: string;
                content: string;
            };
        };
        'control-center': {
            'control-center': string;
            switch: {
                'side-bar': string;
                editor: string;
                view: string;
                'sync-scroll': string;
                'sync-rendering': string;
                'word-wrap': string;
                'typewriter-mode': string;
            };
            navigation: {
                goto: string;
                forward: string;
                back: string;
                refresh: string;
            };
        };
        'doc-history': {
            clear: string;
            'apply-version': string;
            'no-history': string;
            content: string;
            diff: string;
            history: string;
            current: string;
            all: string;
            marked: string;
            mark: string;
            unmark: string;
            delete: string;
            'edit-message': string;
            'delete-dialog': {
                title: string;
                content: string;
            };
            'clear-dialog': {
                title: string;
                content: string;
            };
            'mark-dialog': {
                title: string;
                hint: string;
            };
            'content-too-long-alert': {
                title: string;
                content: string;
            };
        };
        'copy-content': {
            options: string;
            type: string;
            'inline-style': string;
            'include-style': string;
            'inline-image': string;
            'upload-image': string;
            'highlight-code': string;
            rt: string;
            complete: string;
            'copy-tips': string;
            'copy-tips-selected': string;
        };
        'share-preview': {
            expire: string;
            tips: string;
        };
        'electron-zoom': {
            'zoom-in': string;
            'zoom-out': string;
            'zoom-reset': string;
        };
        extension: {
            'extension-manager': string;
            all: string;
            installed: string;
            official: string;
            unofficial: string;
            unknown: string;
            author: string;
            origin: string;
            'unpacked-size': string;
            'latest-version': string;
            'installed-version': string;
            homepage: string;
            download: string;
            'toast-loaded': string;
            upgradable: string;
            incompatible: string;
            'not-installed': string;
            enabled: string;
            disabled: string;
            'reload-required': string;
            'no-extension': string;
            reload: string;
            install: string;
            uninstall: string;
            installing: string;
            uninstalling: string;
            upgrade: string;
            disable: string;
            enable: string;
            'uninstall-confirm': string;
            registry: string;
            'activation-time': string;
            requirement: string;
            'auto-upgrade': string;
            'unknown-origin-tips': string;
            'extensions-auto-upgraded': string;
            'fetch-registry-failed': string;
        };
        'get-started': {
            'get-started': string;
            start: string;
            help: string;
            recent: string;
        };
        'search-panel': {
            'search-files': string;
            'placeholder-search': string;
            'for-history': string;
            'files-to-include': string;
            'files-to-exclude': string;
            'match-case': string;
            'match-whole-word': string;
            'use-regex': string;
            'expand-all': string;
            'collapse-all': string;
        };
        'file-changed-alert': {
            title: string;
            content: string;
            reload: string;
        };
    };
};
export declare type Flat<T extends Record<string, any>, P extends string = ''> = ({
    [K in keyof T as (T[K] extends string ? (K extends string ? (P extends '' ? K : `${P}.${K}`) : never) : (K extends string ? keyof Flat<T[K], P extends '' ? K : `${P}.${K}`> : never))]: never;
});
export declare type Language = keyof typeof languages;
export declare type MsgPath = keyof Flat<BaseLanguage>;
export declare function getText(data: Record<string, any>, path: MsgPath, ...args: string[]): string;
export declare function translate(lang: Language, path: MsgPath, ...args: string[]): string;
export declare function mergeLanguage(lang: Language, nls: Record<string, any>): void;
export {};
