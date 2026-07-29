---
layout: default
title: HomePage
---

<section class="home-hero">
  <p class="eyebrow">Personal Blog</p>
  <h1>欢迎来到我的博客</h1>
  <p class="home-hero-text">
    用于整理 Profile、比赛复现、学习笔记和阶段性总结
  </p>
  <div class="home-actions">
    <a class="button" href="{{ '/profile/' | relative_url }}">查看 Profile</a>
    <a class="button ghost" href="{{ '/topics/' | relative_url }}">浏览 Topics</a>
    <a class="button ghost" href="{{ '/comments/' | relative_url }}">Comments</a>
  </div>
</section>


<div class="welcome-corner" aria-label="Welcome message">
  <span id="welcome-typewriter"></span>
</div>

<script>
  (function () {
    var target = document.getElementById("welcome-typewriter");
    if (!target) return;

    var text = "Welcome to my blog!";
    var typingMs = 1500;
    var holdMs = 950;
    var blankMs = 360;
    var cycleMs = typingMs + holdMs + blankMs;
    var startedAt = performance.now();
    var lastValue = "";
    
    function render(now) {
      var elapsed = (now - startedAt) % cycleMs;
      var nextValue = "";
    
      if (elapsed < typingMs) {
        var progress = elapsed / typingMs;
        var count = Math.min(text.length, Math.floor(progress * (text.length + 1)));
        nextValue = text.slice(0, count);
      } else if (elapsed < typingMs + holdMs) {
        nextValue = text;
      }
    
      if (nextValue !== lastValue) {
        target.textContent = nextValue;
        lastValue = nextValue;
      }
    
      requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
  })();
</script>
