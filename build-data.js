#!/usr/bin/env node
/**
 * build-data.js — 数据构建脚本
 *
 * 把 scraped_videos.json 编译成站点用的三个文件：
 *
 *   videos_core.js    首屏 24 条     (~5.5 KB / gzip 2.4 KB)   首页立刻加载
 *   videos_data.js    全量 1270 条   (~286 KB / gzip 90 KB)    首页交互时按需加载
 *   videos_player.js  播放页精简数据  (~151 KB / gzip 52 KB)   只在播放页加载
 *
 * 用法：
 *   node build-data.js
 *
 * 视频数据（标题、缩略图、播放地址 embedUrl）更新后跑一次即可。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ============================ 配置 ============================ */

const CORE_COUNT = 24;      // 首屏条数。够 12 张卡 + 翻一页的余量
const TITLE_MAX = 110;      // 标题截断长度，避免超长标题撑爆卡片
const SRC = 'scraped_videos.json';

// 播放地址的默认构造方式。embedUrl 等于这个值时就不单独存，
// 省下 1264 条重复的 URL 字符串。
const stdEmbed = (id) => `https://www.xnxx.com/embedframe/${id}`;

/* ============================ 工具 ============================ */

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m'
};

function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }
function gz(buf) { return zlib.gzipSync(buf).length; }

function die(msg) {
  console.error(`${c.red}✗ ${msg}${c.reset}`);
  process.exit(1);
}

/* ============================ 字段映射 ============================ */
/*
 * 输出为数组而非对象：数组省掉重复的键名，
 * 1270 条数据能从 485KB 压到 280KB。
 *
 * 【首页数据】字段顺序必须和 script.js 里的 F 常量一致：
 *   var F = { id:0, title:1, cat:2, catName:3, thumb:4, views:5, likes:6, tags:7, embed:8 };
 *
 * 【播放页数据】字段顺序必须和 player.js 里的 P 常量一致：
 *   var P = { id:0, title:1, catName:2, views:3, likes:4, duration:5, embed:6 };
 *
 * embed 字段只在 embedUrl 不是标准 xnxx 地址时才写入，否则为 null。
 */
function toRow(v) {
  const e = (v.embedUrl && v.embedUrl !== stdEmbed(v.id)) ? v.embedUrl : null;
  return [
    v.id,
    String(v.title || '').slice(0, TITLE_MAX),
    v.category || null,
    v.categoryName || null,
    v.thumb || null,
    v.views || null,
    v.likes || null,
    Array.isArray(v.extra_tags) ? v.extra_tags : [],
    e
  ];
}

function toPlayerRow(v) {
  const e = (v.embedUrl && v.embedUrl !== stdEmbed(v.id)) ? v.embedUrl : null;
  return [
    v.id,
    String(v.title || '').slice(0, TITLE_MAX),
    v.categoryName || null,
    v.views || null,
    v.likes || null,
    v.duration || null,
    e
  ];
}

/* ============================ 主流程 ============================ */

function main() {
  const root = process.cwd();
  const srcPath = path.join(root, SRC);

  if (!fs.existsSync(srcPath)) {
    die(`找不到 ${SRC}。请在站点目录下运行：cd 站点目录 && node build-data.js`);
  }

  console.log(`${c.bold}读取 ${SRC}${c.reset}`);

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  } catch (e) {
    die(`${SRC} 不是合法 JSON：${e.message}`);
  }

  if (!Array.isArray(raw)) die(`${SRC} 顶层必须是数组`);
  if (raw.length === 0) die(`${SRC} 是空的`);

  const total = raw.length;

  /* ---------- 校验：id 唯一 ---------- */
  const seen = new Set();
  const dupes = [];
  for (const v of raw) {
    if (!v || !v.id) die('存在缺少 id 的条目');
    if (seen.has(v.id)) dupes.push(v.id);
    seen.add(v.id);
  }
  if (dupes.length) {
    console.log(`${c.yellow}⚠ 发现 ${dupes.length} 个重复 id，已保留首次出现：${dupes.slice(0, 5).join(', ')}${dupes.length > 5 ? ' ...' : ''}${c.reset}`);
  }

  /* ---------- 去重 + 过滤无效条目 ---------- */
  const kept = [];
  const dropped = [];
  const used = new Set();
  for (const v of raw) {
    if (used.has(v.id)) { dropped.push({ id: v.id, why: '重复 id' }); continue; }
    if (!v.thumb) { dropped.push({ id: v.id, why: '缺少缩略图' }); continue; }
    used.add(v.id);
    kept.push(v);
  }

  if (dropped.length) {
    console.log(`${c.yellow}⚠ 跳过 ${dropped.length} 条无效数据${c.reset}`);
    const byReason = {};
    for (const d of dropped) byReason[d.why] = (byReason[d.why] || 0) + 1;
    for (const [why, n] of Object.entries(byReason)) {
      console.log(`   ${c.dim}${why}: ${n} 条${c.reset}`);
    }
  }

  if (kept.length === 0) die('过滤后没有任何有效数据');

  /* ---------- 生成三个文件 ---------- */
  const coreRows = kept.slice(0, CORE_COUNT).map(toRow);
  const fullRows = kept.map(toRow);
  const playerRows = kept.map(toPlayerRow);

  const coreOut = `window.V_CORE=${JSON.stringify(coreRows)};\n`;
  const fullOut = `window.V_FULL=${JSON.stringify(fullRows)};\n`;
  const playerOut = `window.V_PLAYER=${JSON.stringify(playerRows)};\n`;

  const corePath = path.join(root, 'videos_core.js');
  const fullPath = path.join(root, 'videos_data.js');
  const playerPath = path.join(root, 'videos_player.js');

  fs.writeFileSync(corePath, coreOut);
  fs.writeFileSync(fullPath, fullOut);
  fs.writeFileSync(playerPath, playerOut);

  /* ---------- 报告 ---------- */
  const coreBuf = Buffer.from(coreOut);
  const fullBuf = Buffer.from(fullOut);
  const playerBuf = Buffer.from(playerOut);

  console.log(`\n${c.bold}输出${c.reset}`);
  console.log(
    `  ${c.green}videos_core.js${c.reset}    ${kb(coreBuf.length).padStart(9)}  ` +
    `${c.dim}(gzip ${kb(gz(coreBuf))})${c.reset}  ${coreRows.length} 条  首页立刻加载`
  );
  console.log(
    `  ${c.green}videos_data.js${c.reset}    ${kb(fullBuf.length).padStart(9)}  ` +
    `${c.dim}(gzip ${kb(gz(fullBuf))})${c.reset}  ${fullRows.length} 条  首页交互时加载`
  );
  console.log(
    `  ${c.green}videos_player.js${c.reset}  ${kb(playerBuf.length).padStart(9)}  ` +
    `${c.dim}(gzip ${kb(gz(playerBuf))})${c.reset}  ${playerRows.length} 条  播放页加载`
  );

  /* ---------- 首屏开销估算 ---------- */
  const firstPaint = gz(coreBuf);
  console.log(
    `\n${c.bold}首屏数据开销${c.reset}  ${c.cyan}${kb(firstPaint)}${c.reset} ` +
    `${c.dim}(gzip 后，不含图片和广告)${c.reset}`
  );

  console.log(`\n${c.green}✓ 完成${c.reset}  上传这三个文件即可，HTML 不用改`);

  /* ---------- 播放地址来源统计 ---------- */
  const custom = kept.filter(v => v.embedUrl && v.embedUrl !== stdEmbed(v.id));
  if (custom.length) {
    const hosts = {};
    for (const v of custom) {
      try { const h = new URL(v.embedUrl).hostname; hosts[h] = (hosts[h] || 0) + 1; } catch (e) { }
    }
    const list = Object.entries(hosts).map(([h, n]) => `${h}(${n})`).join(', ');
    console.log(`${c.dim}ℹ ${custom.length} 条使用自定义播放地址：${list}${c.reset}`);
  }
  const noEmbed = kept.filter(v => !v.embedUrl).length;
  if (noEmbed) {
    console.log(`${c.yellow}⚠ ${noEmbed} 条没有 embedUrl，将回退到 xnxx 默认地址${c.reset}`);
  }

  /* ---------- 提示异常标题 ---------- */
  const longTitles = kept.filter(v => String(v.title || '').length > TITLE_MAX).length;
  if (longTitles) {
    console.log(`${c.dim}ℹ ${longTitles} 条标题超过 ${TITLE_MAX} 字符，已截断${c.reset}`);
  }

  const noCat = kept.filter(v => !v.category).length;
  if (noCat) {
    console.log(`${c.yellow}⚠ ${noCat} 条数据没有 category，这些视频只能在 All 里出现${c.reset}`);
  }
}

main();
