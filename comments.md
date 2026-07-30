---
layout: page
title: Comments
description: "Log in with GitHub to say something"
permalink: /comments/
wide: true
---

<section class="comments-panel">
  <div class="comments-intro">
    <span>GITHUB COMMENTS</span>
    <h2>Share your thoughts</h2>
    <p>Leave your perspective , no matter what you want to say</p>
  </div>
  <div id="comments-widget" class="comments-widget giscus" aria-live="polite"></div>
  <noscript>
    <p class="comments-fallback">请启用 JavaScript，或前往 <a href="https://github.com/BIGX-bigx/BIGX-bigx.github.io/discussions">GitHub Discussions</a> 留言。</p>
  </noscript>
</section>

<script nonce="YmlneC1ibG9nLXVpLTIwMjY=">
  (function () {
    var mount = document.getElementById("comments-widget");
    if (!mount) return;

    var themeName = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    var themeUrl = window.location.origin + "/assets/css/giscus-" + themeName + ".css";
    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "BIGX-bigx/BIGX-bigx.github.io");
    script.setAttribute("data-repo-id", "R_kgDOSzlavQ");
    script.setAttribute("data-category", "Announcements");
    script.setAttribute("data-category-id", "DIC_kwDOSzlavc4DCP2x");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", themeUrl);
    script.setAttribute("data-lang", "en");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    mount.appendChild(script);
  })();
</script>
