# 依赖锁定文件 (`package-lock.json`)

`package-lock.json` 文件由 npm 自动生成和维护，用于精确记录项目依赖项的完整树状结构及其版本。它的主要目的是确保项目在不同环境和时间点上安装的依赖项是完全一致的，从而保证构建和运行的可重复性。

## 功能

-   **精确版本锁定**: 记录每个依赖包（包括其子依赖）的精确版本号、下载地址和内容哈希值。
-   **可重复安装**: 当运行 `npm install` 时，npm 会优先使用 `package-lock.json` 中记录的信息来安装依赖，而不是仅仅依赖 `package.json` 中的版本范围。
-   **依赖树管理**: 详细展示了所有依赖项的嵌套结构，有助于理解和调试依赖冲突。

## 用法

-   **自动生成**: 当 `package.json` 或 `node_modules` 发生变化时（例如，通过 `npm install`, `npm update`, `npm uninstall`），`package-lock.json` 会自动更新。
-   **版本控制**: `package-lock.json` 应该被提交到版本控制系统（如 Git），以确保团队所有成员和部署环境都使用相同的依赖版本。

## 注意事项

-   **不要手动编辑**: 通常不建议手动编辑 `package-lock.json` 文件，因为这可能导致与 `package.json` 或 `node_modules` 的不一致，从而破坏可重复性。
-   **与 `package.json` 的关系**: `package.json` 定义了项目的直接依赖及其允许的版本范围，而 `package-lock.json` 则锁定了这些依赖及其所有子依赖的精确版本。
