---
layout: default
title: HomePage
---

<section class="hero">
  <p class="eyebrow">Personal Blog</p>
  <h1>欢迎来到我的博客</h1>
  <p class="hero-text">
    用于整理 Profile、比赛复现、学习笔记和阶段性总结
  </p>
  <div class="hero-actions">
    <a class="button" href="{{ '/profile/' | relative_url }}">查看 Profile</a>
    <a class="button ghost" href="{{ '/categories/' | relative_url }}">浏览分类</a>
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h2>Latest Posts</h2>
    <a href="{{ '/tags/' | relative_url }}">All tags</a>
  </div>

  {% if site.posts.size > 0 %}
    <div class="post-list">
      {% for post in site.posts %}
        <article class="post-card">
          <div>
            <p class="eyebrow">{{ post.categories | join: " / " }}</p>
            <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
            <p>{{ post.excerpt | strip_html | truncate: 110 }}</p>
          </div>
          <div class="post-meta">
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
          </div>
        </article>
      {% endfor %}
    </div>
  {% else %}
    <p class="muted">还没有文章。你可以在 <code>_posts/</code> 中新增 Markdown 文件。</p>
  {% endif %}
</section>
