(function () {
  var themeToggle = document.getElementById("theme-toggle");

  function updateThemeControl(theme) {
    if (!themeToggle) return;
    var isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "切换到日间模式" : "切换到夜间模式");
  }

  function updateCommentsTheme(theme) {
    var frame = document.querySelector(".utterances-frame");
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      type: "set-theme",
      theme: theme === "dark" ? "github-dark" : "github-light"
    }, "https://utteranc.es");
  }

  if (themeToggle) {
    updateThemeControl(document.documentElement.dataset.theme || "light");
    themeToggle.addEventListener("click", function () {
      var nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem("blog-theme", nextTheme);
      } catch (error) {
        // The current page still switches even when storage is unavailable.
      }
      updateThemeControl(nextTheme);
      updateCommentsTheme(nextTheme);
    });
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealTargets = document.querySelectorAll(
    ".page-header, .home-hero > *, .topics-aside-card, .topics-toolbar, .topics-post-card, .folder-card, .category-mini-card, .web-note-folder-card, .archive-group"
  );

  if (!reducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    revealTargets.forEach(function (element, index) {
      element.setAttribute("data-reveal", "");
      element.style.setProperty("--reveal-delay", Math.min(index % 10, 5) * 45 + "ms");
    });

    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    revealTargets.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  var post = document.querySelector(".post-content");
  var progress = document.getElementById("reading-progress");
  if (!post || !progress) return;

  document.body.classList.add("has-reading-progress");

  function updateReadingProgress() {
    var rect = post.getBoundingClientRect();
    var distance = Math.max(post.offsetHeight - window.innerHeight * 0.55, 1);
    var value = Math.min(1, Math.max(0, -rect.top / distance));
    progress.style.transform = "scaleX(" + value + ")";
  }

  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
})();
