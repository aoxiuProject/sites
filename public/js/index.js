;(function (win, doc, $) {
  win.legend = win.legend || {};

  const BACKGROUND_CHANGE_INTERVAL = 60 * 60 * 1000;
  const searches = {
    baidu: {
      url: 'http://www.baidu.com/s',
      name: 'word'
    },
    youdao: {
      url: 'http://dict.youdao.com/search',
      name: 'q'
    },
    youku: {
      url: 'http://www.soku.com/v',
      name: 'keyword'
    },
    sohu: {
      url: 'http://so.tv.sohu.com/mts',
      name: 'wd'
    },

    jd: {
      url: 'http://search.jd.com/Search',
      name: 'keyword',
    },
    tmall: {
      url: 'https://list.tmall.com/search_product.htm',
      name: 'q'
    }
  };

  const searchForm = doc.forms['search-form'];
  const formElements = searchForm.elements;
  const searchInput = formElements['real-search-kw'];
  const displayInput = formElements['display-search-kw'];
  const youdaoLangParam = formElements['youdao-params'];

  function setBackground(src) {
    document.body.style.backgroundImage = 'url(' + src + ')';
  }

  // const prefix = str =>  _.partial(_.add, str);

  /*
    makeImageNames - makeImageNames(3, 'qq-') 返回 ['qq-01.jpg', 'qq-02.jpg', 'qq-03.jpg']
    @param otherExts {Object} - { 1: '.jpeg', 11: '.png', 17: '.png'}
   */ 
  function makeImageNames(count, prefix, ext = '.jpg', otherExts = {}) {
    return _.times(count)
      .map(n => n + 1)
      .map(n => _.padStart(n, 2, '0'))
      .map(str => str + (_.isUndefined(otherExts[Number(str)]) ? ext : otherExts[Number(str)]))
      .map(str => prefix + str);
  }

  const changeBackground = (function () {
    let imgs = [
      'red_love_heart_tree-wide.jpg', 
    ];

    let qq = makeImageNames(3, 'qq-');

    let celebrities = [];
    const aragakiYui = makeImageNames(4, 'AragakiYui-');
    celebrities = celebrities.concat(aragakiYui);
    
    const frozen = makeImageNames(4, 'frozen-');
    const dramas = [].concat(frozen);

    const summerPalace = makeImageNames(5, 'SummerPalace-');
    const scene = [].concat(summerPalace);

    imgs = imgs.concat(qq, celebrities, dramas, scene);
    console.log('imgs length', imgs.length);
    const imgCount = imgs.length;

    const day = new Date().getDate();

    function varyBackgroundImageByDay() {
      setBackground('images/background/' + imgs[day % imgCount]);
    }

    function varyBackgroundImageByRandom() {
      setBackground('images/background/' + imgs[(Math.random()*imgCount)|0]);
    }

    return function (byDay) {
      byDay ? varyBackgroundImageByDay() : varyBackgroundImageByRandom();
    };
  }());

  const sniff = (function () {
    const urls = {
      news: {
        url: 'http://news.baidu.com/ns',
        word: '?ie=utf-8&word=',
        name: 'word'
      },

      baidu: {
        url: 'http://www.baidu.com/s',
        word: '?ie=utf-8&wd=',
        name: 'wd'
      },

      music: {
        url: 'http://music.163.com/',
        word: '#/search/m/?s=',
        name: 's',
      },

      image: {
        url: 'http://image.baidu.com/',
        word: 'search/index?tn=baiduimage&word=',
      },

      youku: {
        url: 'http://www.youku.com/',
      },

      dict: {
        url: 'http://dict.youdao.com/',
        word: 'search?le=eng&q=',
        name: 'q',
      },
    };
    const reg1 = /^https?:\/\/([^.]+)\.([^.]+)/;
    const encURIComp = win.encodeURIComponent;

    return function (catalog) {
      const href = catalog.href;
      const matches = href.match(reg1);
      const domain1 = matches[1];
      const value = displayInput.value.trim();
      const host = domain1 !== 'www' ? urls[domain1] : urls[matches[2]];

      if (!host.word) return;

      if (value) {
        const searchUrl = host.url + host.word;
        catalog.href = searchUrl + encURIComp(value);
      } else {
        catalog.href = host.url;
      }
    };
  }());

  // 根据搜索引擎调整参数
  function adjustHost(host) {
    youdaoLangParam.disabled = true;

    switch (host) {
      case 'jd': // 有道翻译 - 英语
        youdaoLangParam.disabled = false;
        youdaoLangParam.name = 'enc',
        youdaoLangParam.value = 'utf-8';
        break;
      //default: // 默认 百度搜索
    }

    searchInput.value = displayInput.value.trim();;
    searchInput.name = searches[host].name; // srchName;
    searchForm.action = searches[host].url; // srchAddress;

    return true;
  }

  const getSearchHost = (function () {
    const searches = formElements['search-select'];
    const options = searches.options;

    return function () {
      return options[searches.selectedIndex].value;
    };
  }());

  // select
  function optionSbmtTo() {
    const canBeSubmitted = adjustHost(getSearchHost());
    canBeSubmitted && searchForm.submit();

    return canBeSubmitted;
  }

  ;(function init() {
    changeBackground(false);
    // 标题栏点击进入相关主题搜索
    $('.titles').on('mouseover', 'a', function () {
      sniff(this);
    });
    $('#changer').on('click', function () {
      changeBackground(false);
    });

    $('#searchSelect').on('change', function () {
      adjustHost(getSearchHost());
    });

    $(displayInput).on({
      mouseover: function () {
        this.focus();
      },
      focus: function () {
        this.select();
      },
      keydown: function (e) {
        if(e.keyCode === 13) {
          e.preventDefault();
          if (displayInput.value === '') {
            return false;
          }
          return optionSbmtTo();
        }
      },
    });

    const searchBar = $('#searchBar');

    win.setInterval(() => {
      console.log('change background at %s', new Date().toLocaleString());
      changeBackground(false);
    }, BACKGROUND_CHANGE_INTERVAL);

    // - begin hover input hide titles and select
    searchBar.children('tbody').on({
      mouseenter() {
        searchBar.addClass('input-hovered');
      },
      mouseleave() {
        searchBar.removeClass('input-hovered');
      }
    })

    // [optionSbmtTo, getSearchHost] pulic to sugar.js
    // [changeBackground, setBackground]  pulic to calendar.js
    var siteTab = siteTab || {};
    siteTab.submit = optionSbmtTo;
    siteTab.getSearchHost = getSearchHost;
    siteTab.changeBackground = changeBackground;
    siteTab.setBackground = setBackground;

    win.legend.siteTab = siteTab;
  }());
}(window, document, jQuery));
