/**
 * Global Watch 广告全自动化控制、清理与两侧魔天大楼阵列中心
 * 2026-07-13
 */


// =====================================================================
// 🌟 1. 历史遗留大清理（强力卸载区）
// 💡 换平台、换广告时，把旧平台的特征写在这里，全自动扫描全网页并连根拔除
// =====================================================================
// var CONFIG_REMOVE_LIST = [
//   "juicyads.com",          // 1. 关键字匹配：只要脚本 URL 或代码内包含这个词，直接销毁该 <script>
//   "meta[name='juicyads-site-verification']", // 2. 支持标准选择器：直接根据标签名和属性精准定点清除
//   ".old-ad-banner",        // 3. 支持类名选择器：如果有老平台残留的 HTML 广告容器，直接抹去
//   "#old-popunder-id"       // 4. 支持 ID 选择器
// ];
// =====================================================================
// 🌟 1. 历史遗留大清理（强力卸载区）
// =====================================================================
var CONFIG_REMOVE_LIST = [
];

// =====================================================================
// 🌟 2. 全局无固定位置广告/验证配置区
// =====================================================================
// 【HEAD 区域】
var CONFIG_HEAD = `
  <meta name="juicyads-site-verification" content="2f41ff8f5c89ef911b7cdf02a9f783bd">
`;

// 【BODY 全局弹窗】：放你的 PopUnders 弹窗广告
var CONFIG_BODY_GLOBAL = `
  <script type="text/javascript" src="https://js.juicyads.com/jp.php?c=4474v203r284u4r2p2b4338424&u=https%3A%2F%2Fwww.yymakes.online%2F"></script>
`;


// =====================================================================
// 🌟 3. 核心新增：左右两侧空白区域“对联/摩天大楼”广告位（全自动排布）
// 💡 提示：在后台选择 160x600 或 120x600 尺寸的广告代码，直接粘贴在下方
// =====================================================================

// 【左侧空白区广告】
var CONFIG_SIDE_LEFT = `
  <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122173" data-width="300" data-height="250"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122173});</script>
    </div>

  <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-id="juicyads-native-ads" data-ad-zone="1122172" data-targets="a" src="https://js.juicyads.com/juicyads.native-ads.min.js"></script>
    </div>

    <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122176" data-width="258" data-height="46"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122176});</script>
    </div>

    <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122177" data-width="178" data-height="18"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122177});</script>
    </div>
    
    <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122178" data-width="133" data-height="139"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122178});</script>
    </div>
`;

// 【右侧空白区广告】
var CONFIG_SIDE_RIGHT = `
    <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122174" data-width="632" data-height="190"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122174});</script>
    </div>

        <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122175" data-width="300" data-height="100"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122175});</script>
    </div>

    <div style="margin-bottom: 20px;">
    <script type="text/javascript" data-cfasync="false" async src="https://poweredby.jads.co/js/jads.js"></script>
    <ins id="1122181" data-width="468" data-height="60"></ins>
    <script type="text/javascript" data-cfasync="false" async>(adsbyjuicy = window.adsbyjuicy || []).push({'adzone':1122181});</script>
    </div>
`;


// =====================================================================
// 🌟 4. 嵌入型展示广告位映射区（通过 HTML 里的 ID 盒子手动占位）
// =====================================================================
var CONFIG_AD_SLOTS = {
  // 页面内手写的 728x90 横幅位置
  "ad-slot-leaderboard": `
    `
};


// =====================================================================
// 🛠️ 底层智能驱动与两侧空间动态计算引擎（请勿改动）
// =====================================================================
(function() {

  // 动态注入两侧广告所需的自适应防遮挡样式
  function injectResponsiveStyles() {
    var styleNode = document.createElement('style');
    styleNode.textContent = `
      .gw-side-skyscraper {
        position: fixed;
        top: 140px; /* 避开顶部导航栏，向下错开一点 */
        width: 160px;
        height: 600px;
        z-index: 80;
        display: none; /* 默认在窄屏和移动端彻底隐藏，绝不遮挡文字 */
      }
      /* 当屏幕宽度大于 1500px（主内容1140px + 广告160px*2 + 留白）时才完美展现 */
      @media (min-width: 1520px) {
        #gw-ad-left { display: block; left: calc(50% - 570px - 185px); }
        #gw-ad-right { display: block; right: calc(50% - 570px - 185px); }
      }
    `;
    document.head.appendChild(styleNode);
  }

  function executeWipeOut() {
    if (!CONFIG_REMOVE_LIST || CONFIG_REMOVE_LIST.length === 0) return;
    CONFIG_REMOVE_LIST.forEach(function(item) {
      if (!item || !item.trim()) return;
      try {
        var elements = document.querySelectorAll(item);
        if (elements.length > 0) { elements.forEach(function(el) { el.remove(); }); return; }
      } catch(e) {}
      var scripts = document.querySelectorAll('script');
      scripts.forEach(function(script) {
        if ((script.src && script.src.indexOf(item) !== -1) || (script.textContent && script.textContent.indexOf(item) !== -1)) {
          script.remove();
        }
      });
    });
  }
  
  function safelyInject(htmlText, parentElement, beforeElement) {
    if (!htmlText || !htmlText.trim()) return;
    var currentUrl = encodeURIComponent(window.location.href);
    htmlText = htmlText.replace(/([\?&]u=)[^"'\s&>]+/g, '$1' + currentUrl);

    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlText;

    while (tempContainer.firstChild) {
      var node = tempContainer.firstChild;
      if (node.tagName === 'SCRIPT') {
        var activeScript = document.createElement('script');
        for (var i = 0; i < node.attributes.length; i++) {
          activeScript.setAttribute(node.attributes[i].name, node.attributes[i].value);
        }
        activeScript.text = node.text;
        if (beforeElement) { parentElement.insertBefore(activeScript, beforeElement); } 
        else { parentElement.appendChild(activeScript); }
        tempContainer.removeChild(node);
      } else {
        if (beforeElement) { parentElement.insertBefore(node, beforeElement); } 
        else { parentElement.appendChild(node); }
      }
    }
  }

  function startAdEngine() {
    executeWipeOut();
    injectResponsiveStyles();
    
    // 注入基础全局广告与 Meta
    safelyInject(CONFIG_HEAD, document.head, null);
    safelyInject(CONFIG_BODY_GLOBAL, document.body, document.body.firstChild);
    
    // 🌟 全自动构建并注入左侧摩天大楼
    if (CONFIG_SIDE_LEFT && CONFIG_SIDE_LEFT.trim()) {
      var leftContainer = document.createElement('div');
      leftContainer.id = "gw-ad-left";
      leftContainer.className = "gw-side-skyscraper";
      document.body.appendChild(leftContainer);
      safelyInject(CONFIG_SIDE_LEFT, leftContainer, null);
    }

    // 🌟 全自动构建并注入右侧摩天大楼
    if (CONFIG_SIDE_RIGHT && CONFIG_SIDE_RIGHT.trim()) {
      var rightContainer = document.createElement('div');
      rightContainer.id = "gw-ad-right";
      rightContainer.className = "gw-side-skyscraper";
      document.body.appendChild(rightContainer);
      safelyInject(CONFIG_SIDE_RIGHT, rightContainer, null);
    }
    
    // 注入页面内的局部占位广告
    for (var slotId in CONFIG_AD_SLOTS) {
      var targetPlaceholder = document.getElementById(slotId);
      if (targetPlaceholder) {
        safelyInject(CONFIG_AD_SLOTS[slotId], targetPlaceholder, null);
      }
    }
  }

  if (document.body) { startAdEngine(); } 
  else { document.addEventListener('DOMContentLoaded', startAdEngine); }
})();