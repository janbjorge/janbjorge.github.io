/* Color-scheme boot and toggle.
 *
 * Loaded synchronously from the <head> so data-theme lands on <html> before
 * first paint. The default is light. Clicking a [data-theme-toggle] button
 * stores an override in localStorage, and that override wins on every later
 * visit.
 */
(function () {
  function stored() {
    try {
      var v = localStorage.getItem("theme");
      return v === "dark" || v === "light" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function apply() {
    var theme = stored() || "light";
    document.documentElement.setAttribute("data-theme", theme);
    return theme;
  }

  apply();

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var next = apply() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* Storage blocked (private mode): the flip above still holds for this
       * page; the next load is light again. */
    }
  });
})();
