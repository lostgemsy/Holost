/* Holost zone catalog + CDN connector */
window.HOLOST_ZONE_CONFIG = {
  owner: "lostgemsy",
  repo: "Holost",
  ref: "main",
  htmlDir: "GamesHtml",
  coversDir: "covers"
};

window.HOLOST_ZONES = [
  ...((window.HOLOST_GAMES || []).map(game => ({
    id: game.path,
    name: game.name,
    author: "lostgemsy",
    cover: game.image || "",
    html: game.path.replace(/[^a-zA-Z0-9._-]+/g, "_") + ".html"
  })))
];

window.HOLOST_CDN = function(path) {
  const cfg = window.HOLOST_ZONE_CONFIG;
  return "https://cdn.jsdelivr.net/gh/" + cfg.owner + "/" + cfg.repo + "@" + cfg.ref + "/" +
    path.split("/").map(encodeURIComponent).join("/");
};

window.resolveZoneUrl = function(zone) {
  return window.HOLOST_CDN(
    window.HOLOST_ZONE_CONFIG.htmlDir + "/" + zone.html
  );
};

window.resolveCoverUrl = function(zone) {
  if (!zone.cover) return "";
  return window.HOLOST_CDN(zone.cover);
};

window.getZone = function(id) {
  return window.HOLOST_ZONES.find(z => String(z.id) === String(id));
};
