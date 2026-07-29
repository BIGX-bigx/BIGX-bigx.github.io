(function () {
  var themeToggle = document.getElementById("theme-toggle");

  function updateThemeControl(theme) {
    if (!themeToggle) return;
    var isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "切换到日间模式" : "切换到夜间模式");
  }

  function updateCommentsTheme(theme) {
    var frame = document.querySelector(".giscus-frame");
    if (!frame || !frame.contentWindow) return;
    var themeUrl = window.location.origin + "/assets/css/giscus-" + theme + ".css";
    frame.contentWindow.postMessage({
      giscus: {
        setConfig: {
          theme: themeUrl
        }
      }
    }, "https://giscus.app");
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
  var spotlightCards = document.querySelectorAll(".topics-post-card, .topics-aside-card");

  if (!reducedMotion) {
    spotlightCards.forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", event.clientX - rect.left + "px");
        card.style.setProperty("--spot-y", event.clientY - rect.top + "px");
        card.classList.add("has-spotlight");
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("has-spotlight");
      });
    });
  }

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
