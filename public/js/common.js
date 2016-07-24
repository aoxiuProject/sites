;(function (win, doc) {
  const legend = win.legend = win.legend || {};
  const html = legend.html = legend.html || {};

  html.loadScript = loadScript();

  function loadScript() {
    const otherScript = doc.getElementsByTagName('script')[0];

    return function (url, succ, cls) {
      //console.log('load url: ' + url);
      const script = doc.createElement("script");
      script.async = true;

      if (!url) {
        return ;
      }

      cls && (script.className = cls);
      
      if (succ) {
        script.onload = function() {              
          succ(script);
        }
      }

      script.src = url;
      otherScript.parentNode.appendChild(script);
    };
  }
}(window, document));
