/* Color-scheme boot and toggle.
 *
 * Loaded synchronously from the <head> so data-theme lands on <html> before
 * first paint. The default follows the OS preference and tracks it live;
 * clicking a [data-theme-toggle] button stores an override in localStorage,
 * and that override wins on every later visit.
 */
(function () {
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try {
      var v = localStorage.getItem("theme");
      return v === "dark" || v === "light" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function apply() {
    var theme = stored() || (media.matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    return theme;
  }

  apply();

  media.addEventListener("change", function () {
    if (!stored()) apply();
  });

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var next = apply() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* Storage blocked (private mode): the flip above still holds for this
       * page; the next load falls back to the OS preference. */
    }
  });
})();
