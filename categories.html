---
layout: page
title: Categories
description: "按照文章大类进行区分"
permalink: /categories/
wide: true
---

{% assign article_pages = site.pages | where_exp: "item", "item.path contains 'articles/'" %}
{% assign article_pages = article_pages | where_exp: "item", "item.path contains '.md'" %}
{% assign category_pages = site.pages | where: "layout", "category" | sort: "title" %}

{% if article_pages.size > 0 or site.posts.size > 0 %}
  <div class="folder-grid">
    {% for category_page in category_pages %}
      {% assign category_name = category_page.category %}
      {% assign category_posts = site.posts | where_exp: "post", "post.categories contains category_name" %}
      {% assign category_articles = article_pages | where_exp: "article", "article.categories contains category_name" %}
      {% assign category_items = category_posts | concat: category_articles %}
      {% assign slug = category_name | slugify %}
      {% assign meta = site.data.categories[slug] %}
      {% if category_items.size > 0 %}
        <a class="folder-card simple-card" href="{{ category_page.url | relative_url }}">
          <h2>{{ category_page.title | default: meta.title | default: category_name }}</h2>
          <p>{{ category_page.description | default: meta.description | default: "暂无备注" }} · {{ category_items.size }} 篇</p>
        </a>
      {% endif %}
    {% endfor %}
  </div>
{% else %}
  <p class="muted">还没有分类文章。</p>
{% endif %}
