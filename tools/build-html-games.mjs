#!/usr/bin/env node
/**
 * Build one self-contained HTML entry for every root game folder.
 * The generated HTML stays in htmlGames/, while the game's original assets
 * remain in their existing folder. <base> makes relative game assets resolve
 * through jsDelivr instead of the Holost site.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const owner="lostgemsy", repo="Holost", ref="main";
const cdnRoot=`https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/`;
const outDir="htmlGames";

function api(url){
  return JSON.parse(execFileSync("curl",["-fsSL",url],{encoding:"utf8"}));
}
function encPath(p){
  return p.split("/").map(encodeURIComponent).join("/");
}
function rewriteHtml(html, gamePath){
  const base=cdnRoot+encPath(gamePath)+"/";
  if(!/<head\\b/i.test(html)) return html;
  html=html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
  // Root-relative URLs do not obey <base>, so point them at this game's CDN root.
  const attrs=["src","href","poster","data","action"];
  for(const attr of attrs){
    const re=new RegExp(`(\\\\b${attr}\\\\s*=\\\\s*["'])(/(?!/))([^"']*)(["'])`,"gi");
    html=html.replace(re,(_m,a,_slash,v,q)=>a+base+v+q);
  }
  html=html.replace(/url\\(\\s*(['"]?)(\\/)(?!\\/)([^)'"]+)\\1\\s*\\)/gi,(_m,q,_slash,v)=>`url(${q}${base}${v}${q})`);
  return html;
}

fs.rmSync(outDir,{recursive:true,force:true});
fs.mkdirSync(outDir,{recursive:true});

const tree=api(`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`).tree;
const roots=[...new Set(tree.map(x=>x.path.split("/")[0]).filter(Boolean))]
  .filter(name=>!name.startsWith(".") && !["htmlGames","tools"].includes(name));
let count=0, missing=0;
for(const game of roots){
  const index=tree.find(x=>x.path===`${game}/index.html`);
  if(!index){missing++; continue;}
  const raw=execFileSync("curl",["-fsSL",`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${encPath(index.path)}`],{encoding:"utf8"});
  const out=path.join(outDir,game.replace(/[^a-zA-Z0-9._-]+/g,"_")+".html");
  fs.writeFileSync(out,rewriteHtml(raw,game));
  count++;
}
fs.writeFileSync(path.join(outDir,"manifest.json"),JSON.stringify({
  generatedAt:new Date().toISOString(), ref, cdnRoot, games:count, missingIndex:missing
},null,2));
console.log(`Generated ${count} game HTML files; ${missing} root folders had no index.html.`);
