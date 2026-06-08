---
layout: page
title: Categories
description: "像文件夹一样按照分类浏览文章。"
permalink: /categories/
wide: true
---

{% if site.categories.size > 0 %}
  <div class="folder-grid">
    {% for category in site.categories %}
      {% assign slug = category[0] | slugify %}
      {% assign meta = site.data.categories[slug] %}
      <a class="folder-card" href="{{ '/categories/' | append: slug | append: '/' | relative_url }}">
        <div class="folder-icon" aria-hidden="true"></div>
        <div>
          <h2>{{ meta.title | default: category[0] }}</h2>
          <p>{{ meta.description | default: "暂无备注" }}</p>
          <span>{{ category[1].size }} 篇文章</span>
        </div>
      </a>
    {% endfor %}
  </div>
{% else %}
  <p class="muted">还没有分类文章。</p>
{% endif %}
