---
layout: default
title: HomePage
---

<section class="home-hero">
  <p class="eyebrow">Personal Blog</p>
  <h1>欢迎来到我的博客</h1>
  <p class="home-hero-text">
    用于整理 Profile、比赛复现、学习笔记和阶段性总结。
  </p>
  <div class="home-actions">
    <a class="button" href="{{ '/profile/' | relative_url }}">查看 Profile</a>
    <a class="button ghost" href="{{ '/topics/' | relative_url }}">浏览 Topics</a>
    <a class="button ghost" href="{{ '/diary/' | relative_url }}">书写 Diary</a>
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
    var index = 0;

    function tick() {
      target.textContent = text.slice(0, index);

      if (index < text.length) {
        index += 1;
        setTimeout(tick, 90);
        return;
      }

      setTimeout(function () {
        target.textContent = "";
        setTimeout(function () {
          index = 0;
          setTimeout(tick, 450);
        }, 120);
      }, 900);
    }

    tick();
  })();
</script>
