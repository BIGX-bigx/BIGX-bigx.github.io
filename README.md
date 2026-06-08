# BIGX Blog

个人静态博客，基于 GitHub Pages 原生支持的 Jekyll。

## 页面结构

- `HomePage`: 首页，展示简介和最新文章。
- `Profile`: 个人经历页面，包含 GitHub 链接。
- `Categories`: 按分类浏览文章。
- `Tag`: 按标签浏览文章。

## 写新文章

在 `_posts/` 目录新增 Markdown 文件，文件名格式：

```text
YYYY-MM-DD-title.md
```

文章头部示例：

```yaml
---
title: "比赛题目复现标题"
date: 2026-06-08 20:00:00 +0800
categories: [Writeup]
tags: [web, ctf, reproduction]
---
```

正文直接写 Markdown。

## 本地预览

如果本机已经安装 Ruby：

```bash
bundle install
bundle exec jekyll serve
```

然后访问：

```text
http://127.0.0.1:4000
```

## 推送到 GitHub

首次推送建议：

```bash
git remote add origin https://github.com/BIGX-bigx/BIGX-bigx.github.io.git
git branch -M main
git add .
git commit -m "Initialize Jekyll blog"
git push -u origin main
```

之后更新文章：

```bash
git add .
git commit -m "Add new writeup"
git push
```

## GitHub Pages 设置

进入仓库 `Settings -> Pages`：

- Source 选择 `Deploy from a branch`
- Branch 选择 `main`
- Folder 选择 `/ (root)`

保存后等待 GitHub Pages 构建完成。
