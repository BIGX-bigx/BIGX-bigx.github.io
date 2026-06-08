---
layout: page
title: Categories
description: "按照分类浏览文章。"
permalink: /categories/
---

{% if site.categories.size > 0 %}
  <div class="archive-list">
    {% for category in site.categories %}
      <section class="archive-group">
        <h2 id="{{ category[0] | slugify }}">{{ category[0] }}</h2>
        <ul>
          {% for post in category[1] %}
            <li>
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </li>
          {% endfor %}
        </ul>
      </section>
    {% endfor %}
  </div>
{% else %}
  <p class="muted">还没有分类文章。</p>
{% endif %}
