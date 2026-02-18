---
title: Journal多语言模型的重新构建
date: 2026-1-8 22:0:0 +0800
categories: [开发]
tags: [android,codex]
---

这个软件中的文本99%都是硬编码和来自Json文件中的硬编码。

于是个人先是使用 I18n 翻译键替换掉了在 UI 中大量使用的英文单词。（因为之前没接触安卓开发，不知道能够直接使用 String ，来自value(-<localize>)）,例如value-zh_CN之类。

然后对于硬编码的药物Json，先是让codex把大的json拆分为各个药物的小json（同时修改读取逻辑）。然后为了改动小，则直接翻译json中的文本部分，例如description，然后使用原文作为缺省，这样看翻译像是补丁。

例如在中文条目下写：
```
{
  "summary": "不想写"
}
```
于是summary便被替换，其余值则保持不变。

参照：
https://github.com/LoliLin/journal-android-multilingual/blob/main/docs/substances-translation-protocol.md

不够还要把关键词单独整理出来，防止它被不小心翻译了。

https://github.com/LoliLin/journal-android-Cn/
