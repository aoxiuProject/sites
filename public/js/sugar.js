;(function () {
  var win = window,
    legend = win.legend,
    min = win.Math.min,

    submit = legend.siteTab.submit,
    getSearchHost = legend.siteTab.getSearchHost,

    loadScript = legend.html.loadScript,
    encURIComp = win.encodeURIComponent,
    id = document.getElementById.bind(document),

    prevInput = String(Math.random()),
    prevFlag = 'baidu',
    input = id('display-search-kw'),
    $sugar = $('#sugar'),
    $sugarUl = $('#sugar > ul'),
    sugarUrl = '',
    sugarCache = {}, // 所有的query为空的推荐缓存至sugarCache
    MAX_SUGAR_COUNT = 10,

    sugar = {
      baidu: makeBaiduSuggestionUrl, // 百度搜索 百度
      youku:  makeYoukuSuggestionUrl,
      sohu: makeSohuSuggestionUrl,
    },

    youkuSearchUrl = 'http://www.soku.com/v?keyword=',

    baiduSugar = 'http://suggestion.baidu.com/su?ie=utf-8&json=1&p=3&cb=legend.cb.handleBaiduSuggestion&wd=',
    sohuSugar = 'http://tip.tv.sohu.com/s?callback=legend.cb.handleSohuSuggestion&encode=utf-8&key=',
    cb = legend.cb = legend.cb || {}; // 所有的jsonp回调函数挂载于此

  function show($node) {
    $node.removeClass('hidden');
  }
  function hide($node) {
    $node.addClass('hidden');
  }
  function isHidden($node) {
    return $node[0].className.indexOf('hidden') !== -1;
  }

  function fillDetails(d) {
    if (!d) {
      return;
    }

    var infos = d.infos;
    if (infos.some((info) => !!info)) {
      var item = '',
        $panel = null,
        $sugLis = $sugarUl.addClass('sg-minHeight').find('li'),
        catagories = {
          'default': ['类型', '主演', '年代', '播放'],
          movie: ['类型', '主演', '年代', '播放'],
          person: ['国籍', '职业', '生日', '详情'],
          music: ['类型', '歌手', '年代', '播放'],
          show: ['类型', '主持人', '年代', '播放'],
          tvDrama: ['类型', '主演', '年代', '播放'],
          comic: ['类型', '主演', '年代', '播放']
        },
        catagory;

      $('.panel').remove();

      var i, img, titles, info, actors;
      for (i = 0; i < MAX_SUGAR_COUNT; ++i) {
        img = d.imgs;
        if (img.link[i]) {
          $panel = $('<div class="panel"></div>');

          titles = d.titles;
          info = infos[i];

          catagory = catagories[info.tag || 'movie'];

          //console.log(info.tag);
          //console.log(catagory);

          actors = info.starring? info.starring: '暂无';

          item = '<div class="item"><div class="thumb"><a href="' + img.link[i] +
            '" target="_blank" title="' + titles.title[i] + '"><img width="70" height="105" src="' + img.src[i] + '" alt="' + img.alt[i] + '"></a></div><div class="title"><a href="' + titles.link[i] +

            '" target="_blank" title="' + titles.title[i] + '">' + titles.title[i] + '</a></div>' + (info.type?'<div class="pub">'+
              catagory[0]+': ' + info.type + '</div>':'') + '<div class="actor" title="' +

            actors + '">' +catagory[1] +': ' + actors + '</div>' + '<div class="period">' +catagory[2] +': ' + (info.year?info.year:'暂无') + '</div><div class="play"><a class="btn btn_play_s" href="' + info.playUrl + '" target="_blank" title="' + info.playPrompt + '"><em>'+(info.canPlay?'播放':'详情')+'</em><i class="ico_play"></i></a></div></div>';

          // 增加剧集 begin
          var recentEpsInfo = info.update || '',
            eps = info.episodes;

          if (eps && eps.length > 1) {
            item += '<ol class="eps">'; //增加 class="eps"为了剧集 mouseover 事件

            var epsLen = eps.length,
              MAX_EPISODE = 6,
              tempLen = min(MAX_EPISODE, epsLen) - 1,
              ep;

            // 展现 4 + 1 + 1 部
            // 最新5集
            recentEpsInfo = eps[0].desc;
            for (var epsIndex = 0; epsIndex < tempLen; ++epsIndex) {
              ep = eps[epsIndex];
              item += `<li><a title="第${ep.num}集" href="${ep.url}" class="episode" eps-info="${ep.desc}">${ep.num}</a></li>`
            }

            // 最后1集
            ep = eps[epsLen - 1];
            item += `<li><a title="第${ep.num}集" href="${ep.url}" class="episode" eps-info="${ep.desc}">${ep.num}</a></li></ol>`            
          }
          // 增加剧集信息, 随着 mouseover 剧集而变化
          item += '<p class="eps-info">'+recentEpsInfo+'</p>';
          // 增加剧集 end

          $panel.html(item);

          // 增加小箭头
          $sugLis.eq(i).append('<span class="arrow">></span>');
          $sugLis[i].appendChild($panel[0]);
        }
      }
    }
  }
  // 设置推荐来自哪里
  function expandFirstPicItem() {
    $sugar.find('li').has('.panel').first().addClass('cur');
  }

  const setSugarFooter = (function () {
    const _footerLink = id('sg-footer-link');
    const _sgHosts = {
      baidu: ['百度搜索', 'http://www.baidu.com/'],
      youku: ['优酷视频', 'http://www.youku.com/'],
      sohu: ['搜狐视频', 'http://tv.sohu.com/'],
    };

    return function (host) {
      const hostInfo = _sgHosts[host];
      _footerLink.textContent = hostInfo[0];
      _footerLink.href = hostInfo[1];
    };
  }());

  function handleSuggestion(host, items, query, hasInitialSuggestions, videoInfor) {
    if (items.length === 0) {
      hide($sugar);
      return ;
    }

    var lists = '',
      item,
      i,
      itemCount = min(items.length, MAX_SUGAR_COUNT);

    for (i = 0; i < itemCount; ++i) {
      item = items[i];
      if (query && item.indexOf(query) !== -1) { // query 为空也会进入
        lists += ('<li data-item="'+ item +'">' + query + '<b>' + item.replace(query, '') + '</b></li>');
      }
      else if (hasInitialSuggestions){
        lists += ('<li data-item="'+ item +'">' + '<span class="rank top'+(i+1)+'">'+(i+1)+'</span>' + item + '</li>');
      }
      else {
        lists += ('<li data-item="'+ item +'">' + item + '</li>');
      }
    }
    $sugarUl.html(lists);
    // baidu 等没有视频信息videoInfor不需要.video，不用控制min-height
    $sugarUl.removeClass('sg-minHeight');

    fillDetails(videoInfor);

    show($sugar);

    // 自动hover第一个有视频信息的li
    expandFirstPicItem();

    setSugarFooter(host);
    // 优酷等视频网站query为空时保存一份至内存，不必每次都请求
    if (query === '') {
      if (typeof sugarCache[host] === 'undefined') {
        sugarCache[host] = $sugarUl[0].innerHTML;
      }
    }
  }

  cb['handleBaiduSuggestion'] = function (sg) {
    handleSuggestion('baidu', sg.s, sg.q);
  };

  function arrayOf(str, len) {
  	return _.fill(Array(len), str);
    // return (new Array(len)).fill(str);
  }
  cb['handleYoukuSuggestion'] = function (sg) {
    //console.log(sg);
    var items = [];
    var r = sg.r;

    // imgs and titles's link is the same
    var imgs = {
    	src: arrayOf('', MAX_SUGAR_COUNT),
    	link: arrayOf('', MAX_SUGAR_COUNT),
    	alt: arrayOf('', MAX_SUGAR_COUNT)
    };

    var titles = {
    	title: arrayOf('', MAX_SUGAR_COUNT),
    	link: arrayOf('', MAX_SUGAR_COUNT)
    };
    //var info = {'type':'', 'starring':'', 'year':'', 'playLink':''};
    var infos = arrayOf({}, MAX_SUGAR_COUNT), prompt, // 有必要的话，提供初始值
      i, value, itemCount = min(r.length, MAX_SUGAR_COUNT),
      hasPic;

    for (i = 0; i < itemCount; ++i) {
      items.push(r[i].c);

      if (r[i].u) {
        hasPic = true;
        value = r[i].u[0];

        prompt = value.m === '综艺'? '播放最新一期': '播放第一集';
        
        imgs.src[i] = value.a;
        imgs.link[i] = youkuSearchUrl + value.j; // youku呈现的是搜索结果不是value.d
        imgs.alt[i] = prompt;
        
        titles.title[i] = value.j;

        infos[i].type = (value.m && (value.m+'-'+value.w)) || '';
        infos[i].starring = value.p.replace(/,/g, ' ');
        infos[i].year = value.y;
        infos[i].update = r[i].z || '';
        infos[i].canPlay = true;

        // 报警系统
        console.assert(value.k, 'value.k is empty in handleYoukuSuggestion and its value is', r[i].z);

        infos[i].playUrl = value.k;
        infos[i].playPrompt = prompt;
      }
    }

    titles.link = imgs.link;

    var videoInfor = hasPic ? {'imgs': imgs, 'titles': titles, 'infos': infos}: null;

    // console.log(videoInfor);
    var q = sg.q;
    var hasInitialSuggestions = (items.length === MAX_SUGAR_COUNT && q === '');
    handleSuggestion('youku', items, q, hasInitialSuggestions, videoInfor);
  };

  cb['handleSohuSuggestion'] = function (sg) {
    var items = [];
    var r = sg.r;
    // imgs and titles's link is the same
    var imgs = {
    	src: arrayOf('', MAX_SUGAR_COUNT),
    	link: arrayOf('', MAX_SUGAR_COUNT),
    	alt: arrayOf('', MAX_SUGAR_COUNT)
    };
    var titles = {
    	title: arrayOf('', MAX_SUGAR_COUNT),
    	link: arrayOf('', MAX_SUGAR_COUNT)
   	};
    //var info = {'type':'', 'starring':'', 'year':'', 'playLink':''};
    var infos = arrayOf({}, MAX_SUGAR_COUNT);
    var desc = null, sohuSearchUrl = 'http://so.tv.sohu.com/mts?wd=',
      playLink, serial, prompt,
      types = {
        '100': '电影', '101': '电视剧', '106': '综艺',
        '115': '动漫', '121': '音乐', '200': '人物',
      },
      type,
      episodes,
      serialRecent,
      keyword,
      searchUrl,
      hasPic;

    $.each(r, function (i, value) {
        value.t && items.push(value.t);
      value.n && items.push(value.n);
      //console.log('title');console.log(value.t);
      desc = value;
      infos[i].type = '';
      if (desc.pic) {
        //console.log(desc);
        hasPic = true;
        prompt = '';
        serialRecent = desc.serial && desc.serial[0];
        keyword = desc.t || desc.n;
        prompt = (serialRecent && serialRecent.t) || keyword;
        searchUrl = sohuSearchUrl + decodeURIComponent(keyword);
        type = types[desc.cid];

        imgs.src[i] = desc.pic;
        imgs.link[i] = desc.album || searchUrl;
        imgs.alt[i] = prompt;
        titles.title[i] = keyword;
        // vga 综艺 2 动漫 31 电视剧 21 电影 31 - 所以vga不能当做视频type
        // cid 电影 100 音乐 121 电视剧 101 动漫 115 综艺 106
        // 人物 200
        if (type !== '人物') {
          infos[i].type = types[desc.cid] + ((desc.language && ' (' + desc.language + ')') || '');
          infos[i].tag = (type !== '音乐' ? 'default' : 'music');
          infos[i].canPlay = true;
        } else {
            infos[i].type = desc.c;
          infos[i].tag = 'person';
          infos[i].canPlay = false;
        }

        infos[i].starring = (desc.actors && desc.actors.replace(/;/g, ' ')) || desc.p;
        infos[i].year = desc.year || desc.b; // b for human's birthday

        playLink = (serialRecent && serialRecent.u) || desc.url || searchUrl; // serialRecent.length-1
        infos[i].playUrl = playLink;
        infos[i].playPrompt = prompt;
        // 增加剧集 serial: no t u
        episodes = desc.serial;
        if (episodes) {
          infos[i].episodes = [];
          for (var epsIndex = 0, epsLen = episodes.length; epsIndex < epsLen; ++epsIndex) {
            infos[i].episodes.push({
              num: episodes[epsIndex].no,
              desc: episodes[epsIndex].t,
              url: episodes[epsIndex].u
            });
          }
        }
        // 增加剧集 end
      }
    });
    //console.log('items');console.log(items);
    titles.link = imgs.link;

    var videoInfor = hasPic? { imgs: imgs, titles: titles, infos: infos }: null;
    var q = sg.q;
    var hasInitialSuggestions = (items.length === MAX_SUGAR_COUNT && q === '');
    handleSuggestion('sohu', items, q, hasInitialSuggestions, videoInfor);
  };
  function makeBaiduSuggestionUrl(key) {
    return key ? baiduSugar + encURIComp(key): '';
  }
  function makeYoukuSuggestionUrl(key) {
    return 'http://tip.soku.com/search_' + (key ? 'keys' : 'yun') + '?jsoncallback=legend.cb.handleYoukuSuggestion&query=' + encURIComp(key) + '&site=2&t=' + (new Date().getTime());
  }
  function makeSohuSuggestionUrl(key) {
    return sohuSugar + encURIComp(key) + (key ? '' : '&top=1');
  }
  // 如果有键按下和单击（适应优酷，搜狐）输入框，调用接口
  function callSuggest(host) {
    var val = input.value.trim(),
      cachedHtml;

    if (val !== prevInput || host !== prevFlag) {
      prevInput = val;
      prevFlag = host;

      // 从内存取出
      if (val === '') {
        cachedHtml = sugarCache[host];
        if (cachedHtml) {
          $sugarUl[0].innerHTML = cachedHtml;
          show($sugar);
          return ;
        }
      }

      $('.legend_cb_handleXSuggestion').remove(); // 效率高 可完全删除

      sugarUrl = sugar[host] ? sugar[host](val) : makeBaiduSuggestionUrl(val);
      sugarUrl === '' && hide($sugar);

      loadScript(sugarUrl, function () {
        var cur = $sugarUl.find('li.cur').index();;
        upDownToSelectItem.cur = cur;
        (cur !== -1 ) && (upDownToSelectItem.autoHilight = true);
      }, 'legend_cb_handleXSuggestion');
    }
  }

  var sugarTimer;
  $(input).on({
    keyup: function (e) {
      //console.log('keyup');
      if (upOrDownHit(e.which)) {
        return ;
      }

      if (sugarTimer) {
        clearTimeout(sugarTimer);
      }

      sugarTimer = setTimeout(function () {
        callSuggest(getSearchHost());
      }, 350);
    },
    keydown: function (e) {
      //console.log('keydown');
      !isHidden($sugar) && upOrDownHit(e.which) && upDownToSelectItem(e.which);
    },
    click: function () {
      // 增加点击显示下拉
      callSuggest(getSearchHost());
      $sugarUl[0].textContent && show($sugar);
      expandFirstPicItem();
    }
  });

  $('#search-select').on('change', function () {
    callSuggest(getSearchHost());
    input.focus();
  });

  // 点击其他 隐藏推荐
  $(document).on('click', function (e) {
    var nodeName = e.target.nodeName;
    if (nodeName !== 'INPUT' && nodeName !== 'SELECT') {
      hide($sugar);
    }
  });

  // 上下按键控制下拉列表选中
  function upDownToSelectItem(key) { // children
    var $sugItems = $sugarUl.children('li'),
      len = $sugItems.length,
      cur = upDownToSelectItem.cur,
      prev = cur,
      prevItem;

    if (len > 10) {
      throw new RangError('下拉提示不应该超过10条');
    }

    if (upDownToSelectItem.autoHilight && down(key)) {
      upDownToSelectItem.autoHilight = false;

      console.log('prev', prev);
      prevItem = $sugItems[prev].getAttribute('data-item');

      if (prevItem !== input.value) {
        input.value = prevItem;
        return ;
      }
    }

    (prev !== -1) && $($sugItems[prev]).removeClass('cur');
    //$sugItems.removeClass('cur');

    if (down(key)) {
      cur++;
    }
    else if (up(key)) {
      cur--;
    }

    if (cur >= len) {
      cur = 0;
    }
    else if (cur < 0) {
      cur = len - 1;
    }
    upDownToSelectItem.cur = cur;

    //console.log(cur);

    input.value = $($sugItems[cur]).addClass('cur')[0].getAttribute('data-item');
  }

  function down(key) {
    return key === 40;
  }
  function up(key) {
    return key === 38;
  }

  function upOrDownHit(key) {
      return key === 38 || key === 40;
  }

  // 给 ol#eps li 增加 mouseover 事件
  $sugar.on('mouseover', '.episode', function () {
    $(this).parents('.eps').next('.eps-info').text(this.getAttribute('eps-info'));
  });
  // 动态加载的li，用on提供的数据代理功能
  $sugarUl.on({
    mouseenter: function () {
      $(this).addClass('cur');
    },
    mouseleave: function () {
      $(this).removeClass('cur');
    },
    click: function (e) {
      input.value = this.getAttribute('data-item');
      e.target.nodeName !== 'A' && submit();
    }
  }, 'li');
})();
