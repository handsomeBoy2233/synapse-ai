# 站点维护手册

---

## 一、数据更新（最常用）

视频数据变了以后，**不要手改任何 js 文件**，跑一条命令就行：

```bash
cd 站点目录
node build-data.js
```

它会读 `scraped_videos.json`，自动生成两个文件：

| 文件 | 内容 | 大小 | 何时加载 |
|---|---|---|---|
| `videos_core.js` | 前 24 条 | 约 6 KB（gzip 2.5 KB） | 打开首页立刻加载 |
| `videos_data.js` | 全部 1270 条 | 约 286 KB（gzip 90 KB） | 用户搜索/翻页/滚动时才加载 |
| `videos_player.js` | 播放页精简数据，包含 embedUrl | 约 151 KB（gzip 52 KB） | 打开播放页时加载 |

**为什么分三个**：访客打开首页只看十几张卡片，没必要下载完整数据；播放页也不需要下载首页字段和原始 JSON。`videos_player.js` 只保存播放页需要的标题、统计、时长和 `embedUrl`，其中 6 条 `streamfiles.net` 地址会原样保留，其他视频使用默认 xnxx 地址。

如果修改了 `scraped_videos.json` 里的 `embedUrl`，必须重新生成这三个文件。
---

## 二、一键更新数据（Windows）

直接双击站点目录下的 `update.bat`，或在终端运行：

```powershell
node build-data.js
```

会自动完成：

- 读取 `scraped_videos.json` 并校验 JSON 格式与重复 ID
- 过滤无效条目（如缺少缩略图）
- 重新生成 `videos_core.js`、`videos_data.js`、`videos_player.js`
- 统计自定义播放地址（如 `streamfiles.net`）条数与文件体积

看到 **「[成功] 数据文件已更新」** 即可上传。

---

## 三、换域名 / 换品牌

### 3.1 法律页：什么都不用改

5 个法律页（`2257` / `dmca` / `privacy` / `terms` / `report`）里：

- **没有任何域名**
- **没有任何品牌名**
- 联系方式在运行时自动拼接

```js
var host = location.hostname.replace(/^www\./i, '');   // 取当前域名
var addr = 'dmca' + '@' + host;                        // 拼出邮箱
```

访问 `https://新域名.com/dmca.html`，页面自动显示 `dmca@新域名.com`。

**前提**：新域名必须在 Cloudflare 配好 Email Routing，否则显示的邮箱收不到信。

### 3.2 主站换品牌

编辑 `index.html`、`video.html` 里这些位置：

| 位置 | 搜索什么 |
|---|---|
| 页头 logo | `logo-accent` / `logo-badge` |
| 页面标题 | `<title>` |
| 页脚版权 | `&copy; 2026` |

---

## 四、广告代码怎么写

### 4.1 单行 script 型（Mondiad 这类）

```html
<script async src="https://ds.mrmnd.com/xxxxx.js"></script>
```

直接贴在 `index.html` 的 `<head>` 里。

### 4.2 带全局变量型（PopCash 这类）

```html
<script type="text/javascript">
  window.uid = '5068';      // 注意必须有 window.
  window.wid = '7591';
  (function(){
    var s = document.createElement('script');
    s.src = '//cdn.popcash.net/show.js';
    s.onerror = function(){
      var s2 = document.createElement('script');
      s2.src = '//cdn2.popcash.net/show.js';
      document.body.appendChild(s2);
    };
    document.body.appendChild(s);
  })();
</script>
```

**关键**：原版代码是用 `var uid = '5068'`，这是局部变量，`show.js` 读 `window.uid` 会得到 undefined，广告不显示也不计费。**必须写成 `window.uid`**。

### 4.3 `<ins>` 占位型（JuicyAds 横幅）

```html
<div id="guanggao">
  <ins id="1129194" data-width="908" data-height="258"></ins>
  <script src="https://poweredby.jads.co/js/jads.js"></script>
</div>
```

- `<div id="guanggao">` 是布局容器，保留
- `<ins id="1129194">` 是广告位，必须留
- `<script src="jads.js">` 是执行器

---

## 五、法律页为什么不能挂广告

`2257.html`、`dmca.html`、`privacy.html`、`terms.html`、`report.html` 这 5 个页面**不能有任何广告代码**。

原因：这些页面是给版权方、支付商、广告联盟审核看的合规页面。上面挂弹窗广告会被判定为「用法律页面变现」，直接导致审核不通过或封号。

---

## 六、手机适配

站点在 8 个视口宽度下都实测过，**无横向滚动**：

| 视口 | 列数 | 广告宽 | 标题字号 | 横向溢出 |
|---|---|---|---|---|
| 320（iPhone SE） | 2 | 241px | 12.5px | 无 |
| 360（多数安卓） | 2 | 281px | 12.5px | 无 |
| 390（iPhone 14） | 2 | 311px | 13.1px | 无 |
| 414（iPhone Plus） | 2 | 335px | 13.1px | 无 |
| 768（iPad 竖） | 2 | 681px | 15.7px | 无 |
| 1024（iPad 横） | 2 | 908px | 15.7px | 无 |
| 1366（笔记本） | 3 | 908px | 15.7px | 无 |
| 1920（桌面） | 4 | 908px | 15.7px | 无 |

### 断点设计

| 断点 | 作用 |
|---|---|
| `> 1024px` | 桌面，3–4 列 |
| `768–1024px` | 平板，2 列 |
| `640–768px` | 小平板，2 列 |
| `≤ 640px` | 手机，2 列 + 紧凑间距 |
| `≤ 380px` | 小屏，隐藏分类标签 |

### 手机上的针对性优化

**1. 卡片 2 列而不是 1 列**

1 列时一张卡占满屏宽，12 张卡要滚很久。2 列后一屏能看到 2 张。

**2. 首屏按视口决定加载几张图**

```js
var vw = window.innerWidth;
var eagerCount = vw <= 640 ? 2 : (vw <= 1024 ? 3 : 4);
```

手机一屏只能看到 2 张卡片，所以只立即加载 2 张。原来固定 4 张，手机上会多下载约 57KB 用户根本看不到的图。

**3. 标题两行截断**

```css
.velvet-card .card-title-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
```

避免标题长短不一导致卡片高低不齐。

**4. 分类按钮可横向滑动**

手机上分类有 28 个，改成单行横向滚动，不换行占三行高度。

**5. 触摸目标 ≥ 40px**

分类按钮从 33px 加到 40px，分页按钮同样。

**6. 搜索框字号 16px**

```css
.search-box input { font-size: 16px; }
```

iOS Safari 上输入框字号小于 16px 会自动放大整个页面。

### 广告横幅在手机上的处理

JuicyAds 的 iframe 是**固定 908×258**，手机上会撑破布局导致横向滚动。

处理方式：

```css
@media (max-width: 960px) {
    #guanggao iframe {
        width: 100% !important;
        max-width: 908px !important;
        height: auto !important;
        aspect-ratio: 908 / 258;
    }
}
```

**只缩小，不放大**。宽屏上严格保持 908×258 原尺寸，因为：

- 放大 908px 素材会模糊
- 广告联盟可能判定展示异常，影响结算

### 一个已知限制

缩略图是 xnxx CDN 的 600×337 / 28KB 原图，**无法换成更小的尺寸**。

试过 `_s` / `_m` / `_h` / `_b` 等各种后缀，全部返回 404。CDN 只提供这一个尺寸。

手机上卡片显示 180px 宽，实际下载 600px 宽的图，有浪费但无法避免。如果以后换成自己的图床，记得生成多尺寸 + `srcset`。

### CSS 优先级坑

手机断点里的选择器必须和基础规则同级，否则不生效：

```css
/* 基础规则（两级选择器） */
.velvet-card .card-title-text { font-size: 0.98rem; }

/* 手机断点 —— 必须也写两级，只写 .card-title-text 会被覆盖 */
@media (max-width: 640px) {
    .velvet-card .card-title-text { font-size: 0.82rem; }
}
```

---

## 七、性能基线

| 指标 | 优化前 | 现在 |
|---|---|---|
| 首屏流量（桌面） | 858 KB | **~69 KB** |
| 首屏流量（手机） | — | **~42 KB** |
| DOM 就绪 | 301 ms | **~240 ms** |
| 请求数 | 22 | 13 |
| 桌面首屏图 | 12 张 | 4 张 |
| 手机首屏图 | 12 张 | 2 张 |

### 优化手段

1. **数据分两段**：首屏只加载 24 条，全量按需
2. **图片懒加载**：`<img loading="lazy">`，按视口决定 eager 张数
3. **数据用数组格式**：485KB → 279KB
4. **脚本加 defer**：不阻塞解析
5. **移除未用字体、FontAwesome 异步**
6. **缩略图 CDN preconnect**

---

## 八、常见问题

### Q: 首页空白 / 没有视频

`videos_core.js` 没上传或上传失败。这个文件是**必需**的。

### Q: 搜索、翻页后结果不对

正常。首屏只有 24 条，第一次搜索时才加载全量 1270 条，加载完成后结果就完整了。

### Q: 法律页显示「our Report page」而不是邮箱

`location.hostname` 是空的。通常是用 `file://` 双击打开的本地文件——这是正常的降级行为。上传到真实域名后自动显示邮箱。

### Q: 换了域名但邮箱还是旧的

浏览器缓存。强制刷新（Ctrl+Shift+R），或检查 Cloudflare 是否给新域名配了 Email Routing。

### Q: 视频点进去 404

站内链接必须写 `video?id=xxx`，**不能写** `video.html?id=xxx`。Cloudflare Pages 会把 `.html` 剥掉并 308 重定向，导致参数丢失。

### Q: 手机上广告很小

JuicyAds 是 908×258 的固定尺寸横幅，手机上等比缩到 ~311px 宽。这是正常行为——素材本身是这个比例，放大反而模糊。如果想让手机展示更大，需要在 JuicyAds 后台建一个**手机专用小尺寸 zone**（如 300×250），然后在页面里按视口宽度显示不同的 `<ins>`。

### Q: 手机上出现横向滚动条

检查是不是新加的广告位没有加 `max-width` 约束。`#guanggao iframe` 的规则只覆盖了 JuicyAds，其他联盟的 iframe 需要同样处理。

---

## 九、目录说明

```
站点根目录/
├── index.html          首页
├── video.html          播放页
├── script.js           首页逻辑（两阶段加载 + 懒加载 + 响应式 eager）
├── player.js           播放页逻辑
├── style.css           主样式（含 5 个响应式断点）
├── legal.css           法律页样式
├── videos_core.js      首屏 24 条（build-data.js 生成，勿手改）
├── videos_data.js      首页全量 1270 条（build-data.js 生成，勿手改）
├── videos_player.js    播放页数据，包含自定义 embedUrl（勿手改）
├── scraped_videos.json 原始数据（唯一的数据源）
├── build-data.js       数据构建脚本
├── update.bat          Windows 双击一键更新数据脚本
├── 2257.html           2257 合规声明
├── dmca.html           DMCA 与内容下架
├── privacy.html        隐私政策
├── terms.html          服务条款
└── report.html         举报入口
```

---

## 十、日常流程

```powershell
# 1. 更新 scraped_videos.json（尤其是 embedUrl 播放地址）
# 2. 双击运行 update.bat（或在终端运行 node build-data.js）

# 3. 看到更新成功提示后上传：
#    videos_core.js
#    videos_data.js
#    videos_player.js
#    以及本次改过的 player.js / video.html / script.js

# 注意：scraped_videos.json 只作为本地原始数据源，
# 播放页现在不再在线 fetch 它，不必上传它来运行网站。
```
