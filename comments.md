---
layout: page
title: Comments
description: "使用 GitHub 账号登录后，留下你的想法。"
permalink: /comments/
---

<section class="comments-panel">
  <div class="comments-intro">
    <span>GITHUB COMMENTS</span>
    <h2>Say something.</h2>
    <p>评论由 GitHub Issues 托管。首次评论时，GitHub 会要求你确认授权。</p>
  </div>
  <div id="comments-widget" class="comments-widget" aria-live="polite"></div>
  <noscript>
    <p class="comments-fallback">请启用 JavaScript，或前往 <a href="https://github.com/BIGX-bigx/BIGX-bigx.github.io/issues">GitHub Issues</a> 留言。</p>
  </noscript>
</section>

<script>
  (function () {
    var mount = document.getElementById("comments-widget");
    if (!mount) return;

    var script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", "BIGX-bigx/BIGX-bigx.github.io");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("label", "comments");
    script.setAttribute("theme", document.documentElement.dataset.theme === "dark" ? "github-dark" : "github-light");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    mount.appendChild(script);
  })();
</script>
