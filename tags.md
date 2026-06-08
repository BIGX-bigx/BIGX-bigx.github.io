---
layout: page
title: Tag
description: "按照标签浏览文章。"
permalink: /tags/
---

{% if site.tags.size > 0 %}
  <div class="tag-cloud">
    {% for tag in site.tags %}
      <a href="#{{ tag[0] | slugify }}">{{ tag[0] }} <span>{{ tag[1].size }}</span></a>
    {% endfor %}
  </div>

  <div class="archive-list">
    {% for tag in site.tags %}
      <section class="archive-group">
        <h2 id="{{ tag[0] | slugify }}">{{ tag[0] }}</h2>
        <ul>
          {% for post in tag[1] %}
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
  <p class="muted">还没有标签文章。</p>
{% endif %}
