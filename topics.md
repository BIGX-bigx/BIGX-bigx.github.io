---
layout: page
title: Topics
description: "Here is the article page"
permalink: /topics/
wide: true
---

<div class="topics-layout">
  <aside class="topics-aside">
    <a class="topics-aside-card" href="{{ '/categories/' | relative_url }}">
      <span>Folders</span>
      <h2>Categories</h2>
      <p>Grouped by Theme</p>
    </a>
    <a class="topics-aside-card" href="{{ '/tags/' | relative_url }}">
      <span>Keywords</span>
      <h2>Tag</h2>
      <p>Classify via Tags</p>
    </a>
  </aside>

  <section class="topics-post-panel">
    <div class="topics-posts" id="topics-posts">
      {% for post in site.posts %}
        {% assign summary = post.excerpt | strip_html | strip_newlines | strip %}
        <a class="topics-post-card" href="{{ post.url | relative_url }}" data-post-card{% if forloop.index > 10 %} style="display: none;"{% endif %}>
          <div class="topics-post-meta">{{ post.date | date: "%Y-%m-%d" }}{% if post.categories and post.categories.size > 0 %} / {{ post.categories | join: " / " }}{% endif %}</div>
          <h2>{{ post.title }}</h2>
          {% if summary != "" %}
            <p>{{ summary | truncate: 120 }}</p>
          {% endif %}
          {% if post.tags and post.tags.size > 0 %}
            <div class="topics-tags">
              {% for tag in post.tags %}
                <span>{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
        </a>
      {% endfor %}
    </div>
    <nav class="topics-pagination" aria-label="Post pagination" id="topics-pagination"></nav>
  </section>
</div>

<script>
  (function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-post-card]"));
    var pagination = document.getElementById("topics-pagination");
    var pageSize = 10;
    var currentPage = 1;
    var totalPages = Math.ceil(cards.length / pageSize);

    if (!pagination || cards.length <= pageSize) return;
    
    function showPage(page) {
      currentPage = Math.max(1, Math.min(totalPages, page));
      cards.forEach(function (card, index) {
        var start = (currentPage - 1) * pageSize;
        var end = start + pageSize;
        card.style.display = index >= start && index < end ? "" : "none";
      });
      renderPagination();
    }
    
    function makeButton(label, page, active) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "topics-page-btn" + (active ? " active" : "");
      button.textContent = label;
      button.addEventListener("click", function () {
        showPage(page);
      });
      return button;
    }
    
    function renderPagination() {
      pagination.innerHTML = "";
      pagination.appendChild(makeButton("Prev", currentPage - 1, false));
      for (var i = 1; i <= totalPages; i += 1) {
        pagination.appendChild(makeButton(String(i), i, i === currentPage));
      }
      pagination.appendChild(makeButton("Next", currentPage + 1, false));
    }
    
    showPage(1);
  })();
</script>
