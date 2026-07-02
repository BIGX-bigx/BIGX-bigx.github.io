---
layout: page
title: Categories
description: "按照文章大类进行区分"
permalink: /categories/
wide: true
---

{% if site.categories.size > 0 %}
  <div class="folder-grid">
    {% for category in site.categories %}
      {% assign slug = category[0] | slugify %}
      {% assign meta = site.data.categories[slug] %}
      {% assign category_page = site.pages | where: "category", category[0] | first %}
      {% capture fallback_url %}/categories/{{ slug }}/{% endcapture %}
      {% assign category_url = category_page.url | default: fallback_url %}
      <a class="folder-card simple-card" href="{{ category_url | relative_url }}">
        <h2>{{ category_page.title | default: meta.title | default: category[0] }}</h2>
        <p>{{ category_page.description | default: meta.description | default: "暂无备注" }}</p>
      </a>
    {% endfor %}
  </div>
{% else %}
  <p class="muted">还没有分类文章。</p>
{% endif %}
