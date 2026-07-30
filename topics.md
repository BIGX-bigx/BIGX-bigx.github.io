---
layout: page
title: Topics
description: "Here is the article page"
permalink: /topics/
wide: true
topics_search: true
---

<div class="topics-layout">
  <aside class="topics-aside">
    <a class="topics-aside-card" href="{{ '/categories/' | relative_url }}">
      <span class="topics-card-index">01 / Folders</span>
      <h2>Categories</h2>
      <p>Grouped by Theme</p>
      <i aria-hidden="true">→</i>
    </a>
    <a class="topics-aside-card" href="{{ '/tags/' | relative_url }}">
      <span class="topics-card-index">02 / Keywords</span>
      <h2>Tag</h2>
      <p>Classify via Tags</p>
      <i aria-hidden="true">→</i>
    </a>
  </aside>

  <section class="topics-post-panel">
    <div class="topics-posts" id="topics-posts">
      {% assign article_pages = site.pages | where_exp: "item", "item.path contains 'articles/'" %}
      {% assign article_pages = article_pages | where_exp: "item", "item.path contains '.md'" %}
      {% assign all_posts = site.posts | concat: article_pages | sort: "date" | reverse %}
      {% for post in all_posts %}
        {% include topics-post-card.html %}
      {% endfor %}
    </div>
    <p class="topics-empty" id="topics-empty" hidden>No matching articles.</p>
    <nav class="topics-pagination" aria-label="Post pagination" id="topics-pagination"></nav>
  </section>
</div>

<script nonce="YmlneC1ibG9nLXVpLTIwMjY=">
  (function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-post-card]"));
    var pagination = document.getElementById("topics-pagination");
    var search = document.getElementById("topics-search");
    var count = document.getElementById("topics-result-count");
    var empty = document.getElementById("topics-empty");
    var pageSize = 10;
    var currentPage = 1;
    var filteredCards = cards.slice();
    
    function showPage(page, shouldScroll) {
      var totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
      currentPage = Math.max(1, Math.min(totalPages, page));
      cards.forEach(function (card) {
        card.hidden = true;
      });
      filteredCards.forEach(function (card, index) {
        var start = (currentPage - 1) * pageSize;
        var end = start + pageSize;
        card.hidden = !(index >= start && index < end);
      });
      document.getElementById("topics-posts").classList.add("topics-ready");
      empty.hidden = filteredCards.length !== 0;
      count.textContent = filteredCards.length + (filteredCards.length === 1 ? " article" : " articles");
      renderPagination();
      if (shouldScroll) {
        document.getElementById("topics-posts").scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start"
        });
      }
    }
    
    function makeButton(label, page, active) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "topics-page-btn" + (active ? " active" : "");
      button.textContent = label;
      button.addEventListener("click", function () {
        showPage(page, true);
      });
      return button;
    }
    
    function renderPagination() {
      pagination.innerHTML = "";
      var totalPages = Math.ceil(filteredCards.length / pageSize);
      pagination.hidden = totalPages <= 1;
      if (totalPages <= 1) return;
      var previous = makeButton("Prev", currentPage - 1, false);
      previous.disabled = currentPage === 1;
      pagination.appendChild(previous);
      for (var i = 1; i <= totalPages; i += 1) {
        pagination.appendChild(makeButton(String(i), i, i === currentPage));
      }
      var next = makeButton("Next", currentPage + 1, false);
      next.disabled = currentPage === totalPages;
      pagination.appendChild(next);
    }

    search.addEventListener("input", function () {
      var query = search.value.trim().toLowerCase();
      filteredCards = cards.filter(function (card) {
        return !query || card.getAttribute("data-search").indexOf(query) !== -1;
      });
      showPage(1, false);
    });
    
    showPage(1, false);
  })();
</script>
