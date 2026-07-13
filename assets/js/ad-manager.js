/**
 * Global Watch 广告全自动化控制与强力清理中心
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

var CONFIG_REMOVE_LIST = [
];


// =====================================================================
// 🌟 2. 当前生效广告配置区（只对未被上面清理的页面进行安全注入）
// =====================================================================

// 【HEAD 区域】
var CONFIG_HEAD = `
  <meta name="juicyads-site-verification" content="2f41ff8f5c89ef911b7cdf02a9f783bd">
`;

// 【BODY 顶部区域】
var CONFIG_BODY_TOP = `
  <script type="text/javascript" src="https://js.juicyads.com/jp.php?c=4474v203r284u4r2p2b4338424&u=https%3A%2F%2Fwww.yymakes.online%2F"></script>
`;

// 【BODY 底部区域】
var CONFIG_BODY_BOTTOM = `
  `;


// =====================================================================
// 🛠️ 底层智能驱动与清理双引擎（请勿改动）
// =====================================================================
(function() {

  // 第一步：执行历史残留大清洗
  function executeWipeOut() {
    if (!CONFIG_REMOVE_LIST || CONFIG_REMOVE_LIST.length === 0) return;

    CONFIG_REMOVE_LIST.forEach(function(item) {
      if (!item || !item.trim()) return;

      // 尝试 1：当作标准 CSS 选择器直接定点爆破 DOM 节点
      try {
        var elements = document.querySelectorAll(item);
        if (elements.length > 0) {
          elements.forEach(function(el) { el.remove(); });
          return; 
        }
      } catch(e) {
        // 如果不是合法的选择器，说明是纯文本/URL关键字，交由下一步处理
      }

      // 尝试 2：扫描全网页所有 SCRIPT 标签，匹配 src 链接或内部代码关键字
      var scripts = document.querySelectorAll('script');
      scripts.forEach(function(script) {
        if ((script.src && script.src.indexOf(item) !== -1) || 
            (script.textContent && script.textContent.indexOf(item) !== -1)) {
          script.remove();
        }
      });
    });
  }
  
  // 第二步：核心安全注入函数（自动修正 URL 并通关 script 限制）
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

        if (beforeElement) {
          parentElement.insertBefore(activeScript, beforeElement);
        } else {
          parentElement.appendChild(activeScript);
        }
        tempContainer.removeChild(node);
      } else {
        if (beforeElement) {
          parentElement.insertBefore(node, beforeElement);
        } else {
          parentElement.appendChild(node);
        }
      }
    }
  }

  // 统一调度中心
  function startAdEngine() {
    // 1. 先进行全网页历史遗留代码的强力卸载
    executeWipeOut();
    
    // 2. 再安全注入当前配置的新广告
    safelyInject(CONFIG_HEAD, document.head, null);
    safelyInject(CONFIG_BODY_TOP, document.body, document.body.firstChild);
    safelyInject(CONFIG_BODY_BOTTOM, document.body, null);
  }

  if (document.body) {
    startAdEngine();
  } else {
    document.addEventListener('DOMContentLoaded', startAdEngine);
  }
})();