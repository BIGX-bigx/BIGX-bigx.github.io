---
layout: page
title: Tag
description: "使用标签进行文章分类"
permalink: /tags/
---

{% assign article_pages = site.pages | where_exp: "item", "item.path contains 'articles/'" %}
{% assign article_pages = article_pages | where_exp: "item", "item.path contains '.md'" %}
{% capture tag_names_raw %}{% for tag in site.tags %}{{ tag[0] }}|||{% endfor %}{% for article in article_pages %}{% for tag in article.tags %}{{ tag }}|||{% endfor %}{% endfor %}{% endcapture %}
{% assign all_tag_names = tag_names_raw | split: "|||" | uniq | sort %}

{% if all_tag_names.size > 0 %}
  <div class="tag-cloud">
    {% for tag_name in all_tag_names %}
      {% assign tagged_posts = site.posts | where_exp: "post", "post.tags contains tag_name" %}
      {% assign tagged_articles = article_pages | where_exp: "article", "article.tags contains tag_name" %}
      {% assign tagged_items = tagged_posts | concat: tagged_articles %}
      <a href="#{{ tag_name | slugify }}">{{ tag_name }} <span>{{ tagged_items.size }}</span></a>
    {% endfor %}
  </div>

  <div class="archive-list">
    {% for tag_name in all_tag_names %}
      {% assign tagged_posts = site.posts | where_exp: "post", "post.tags contains tag_name" %}
      {% assign tagged_articles = article_pages | where_exp: "article", "article.tags contains tag_name" %}
      {% assign tagged_items = tagged_posts | concat: tagged_articles | sort: "date" | reverse %}
      <section class="archive-group">
        <h2 id="{{ tag_name | slugify }}">{{ tag_name }}</h2>
        <ul>
          {% for post in tagged_items %}
            {% assign post_title = post.title %}
            {% unless post_title %}
              {% assign post_title = post.slug %}
            {% endunless %}
            <li>
              {% if post.date %}<time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>{% else %}<time>ARTICLE</time>{% endif %}
              <a href="{{ post.url | relative_url }}">{{ post_title }}</a>
            </li>
          {% endfor %}
        </ul>
      </section>
    {% endfor %}
  </div>
{% else %}
  <p class="muted">还没有标签文章。</p>
{% endif %}
