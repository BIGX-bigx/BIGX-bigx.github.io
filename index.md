---
layout: page
title: HomePage
description: "个人经历与比赛复现记录。"
---

# 记录个人经历，也复盘每一次比赛

这里用于整理 Profile、比赛复现、学习笔记和阶段性总结。内容保持简洁、可检索、方便长期维护。

- [查看 Profile]({{ '/profile/' | relative_url }})
- [浏览 Categories]({{ '/categories/' | relative_url }})
- [浏览 Tag]({{ '/tags/' | relative_url }})

## Latest Posts

{% if site.posts.size > 0 %}
{% for post in site.posts %}
- {{ post.date | date: "%Y-%m-%d" }} [{{ post.title }}]({{ post.url | relative_url }})  
  分类：{{ post.categories | join: " / " }}{% if post.tags and post.tags.size > 0 %}；标签：{{ post.tags | join: ", " }}{% endif %}
{% endfor %}
{% else %}
还没有文章。你可以在 `_posts/` 中新增 Markdown 文件。
{% endif %}
