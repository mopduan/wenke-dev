# 优化思路

1. 目录结构改进
2. README 完善
3. lib/utils 代码整理
4. 按照 webpack 的代码规范来配置 eslint 和 prettier
5. 依赖为什么要锁定版本？ 开源项目都没有锁定版本

## Prettier

使用 `prettier` 来美化代码，做到格式统一，`.prettier.js` 配置参考了 `webpack` （tabWidth:4; singleQuote:true ）

1.  安装 `prettier` 并设置为默认 formatter
2. 设置只在 project 有配置文件的情况下才运行 formatter

```txt
Pro tip: set it to only run Prettier when it detects a Prettier config file. Makes it so you never have to turn it off. In order to do that, set prettier.requireConfig to true and editor.formatOnSave to true
```
