/*!
 * myPagination Jquery Pagination Plug-in Library v6.0
 * 
 * http://linapex.blog.163.com/
 *
 * Date: 2013/3/24 21:20
 */

(function($){function init(param,obj){function getParam(){var e="page="+opts.currPage;return opts.ajax.param&&(e+="&"+opts.ajax.param),e}function getPanelTipInfo(){var e="";if(opts.panel.tipInfo_on){var t=document.createElement("span");t=$(t);var n=t.text(opts.panel.tipInfo).text();if(-1!=n.indexOf("{input}")){var r="<input type='text' value='"+opts.currPage+"' >";n=n.replace("{input}",r),n=n.replace("{sumPage}",opts.pageCount),t.html(n),r=t.children(":text:first"),r.css(opts.panel.tipInfo_css),e=t.html()}else if(-1!=n.indexOf("{select}")){for(var i=document.createElement("select"),s=1;parseInt(opts.pageCount)>=s;s++){var o=new Option(s,s);i.options.add(o)}t.html("");var u=n.substr(0,n.indexOf("{select}")),a=n.substr(n.indexOf("{select}")+"{select}".length).replace("{sumPage}",opts.pageCount);t.append(u),t.append(i),t.append(a),e=t.html()}}return e}function onRequest(){debug(opts.id),debug("ajax请求参数列表:"),debug(getParam()),opts.ajax.on?(opts.ajax.ajaxStart(),$.ajax({url:opts.ajax.url,type:opts.ajax.type,data:getParam(),contentType:"application/x-www-form-urlencoded;utf-8",async:!0,cache:!1,timeout:6e4,error:function(){alert("访问服务器超时，请重试，谢谢！")},success:function(e){opts.ajax.ajaxStop(),responseHandle(e),createPageBar()}})):createPageBar()}function responseHandle(data){var pageCountId=opts.ajax.pageCountId,resultPageCount=1;switch(opts.ajax.dataType){case"json":try{data=eval("("+data+")")}catch(err){}finally{resultPageCount=eval("data."+pageCountId)}break;case"xml":try{resultPageCount=$(data).find(pageCountId).text()}catch(e){debug("xml返回数据解析错误，使用默认的pageCount=1"),resultPageCount=1}break;default:try{resultPageCount=$(data).find(":hidden[id='"+pageCountId+"']").val()}catch(e){debug("html返回数据解析错误，使用默认的pageCount=1"),resultPageCount=1}}debug(opts.id),debug("返回总页数:"+resultPageCount),opts.pageCount=resultPageCount,opts.ajax.callback(data)}function createPageBar(){var e=opts.panel.links;opts.currPage=opts.currPage>opts.pageCount?opts.pageCount:opts.currPage;var t=opts.currPage,n=parseInt(opts.pageCount),r=parseInt(opts.pageNumber/2),i=opts.pageNumber,s="";opts.panel.first_on&&(s="<a href='"+e+"' paged='1'>"+opts.panel.first+"</a>"),opts.panel.prev_on&&(s+=1==t?'<span class="disabled" paged="'+opts.panel.prev+'">'+opts.panel.prev+" </span>":"<a href='"+e+"' paged='"+(t-1)+"'>"+opts.panel.prev+" </a>");var o=lastPage=1;for(o=t-r>0?o=t-r:1,o+i>n?(lastPage=n+1,o=lastPage-i):lastPage=o+i,0>=o&&(o=1),o;lastPage>o;o++)s+=o==t?'<span class="current" paged="'+o+'">'+o+"</span>":"<a href='"+e+"' paged='"+o+"'>"+o+"</a>";opts.panel.next_on&&(s+=t==n?'<span class="disabled" paged="'+opts.panel.next+'">'+opts.panel.next+" </span>":"<a href='"+e+"' paged='"+(t+1)+"'>"+opts.panel.next+" </a>"),opts.panel.last_on&&(s+="<a href='"+e+"' paged='"+n+"'>"+opts.panel.last+"</a>"),s+=getPanelTipInfo(),debug(opts.id),debug("最终生成菜单："),debug(s),obj.html(s),obj.children("select").val(opts.currPage),obj.children("select").change(function(){var e=parseInt($(this).children("option:selected").val());opts.currPage=e,onRequest()}),obj.children(":text").keyup(function(){var e=$(this),t=$.trim($(this).val());if(0!=t.length){var n=/^\+?[0-9][0-9]*$/;n.exec(t)||e.val(1)}}),obj.children(":text").keypress(function(e){var t=e.which;if(13==t){var n=$.trim($(this).val());obj.children("a").unbind("click"),obj.children("a").each(function(){$(this).click(function(){return!1})}),opts.currPage=n,onRequest()}}),obj.children("a").each(function(){var e=$(this);e.click(function(){var t=parseInt(e.attr("paged"));return t=t>0?t:1,e.children("a").unbind("click"),e.children("a").each(function(){$(this).click(function(){return!1})}),opts.currPage=t,opts.ajax.onClick(t),onRequest(),$(this).focus(),!1})})}function debug(e){opts.debug&&$.fn.debug(e)}var defaults={currPage:1,pageCount:10,pageNumber:5,cssStyle:"badoo",debug:!1,ajax:{on:!1,type:"POST",pageCountId:"pageCount",url:"jsonTest.php",dataType:"json",param:!1,onClick:function(){return!1},ajaxStart:function(){return!1},ajaxStop:function(){return!1},callback:function(){return!1}},panel:{first:"首页",last:"尾页",next:"下一页",prev:"上一页",first_on:!0,last_on:!0,next_on:!0,prev_on:!0,links:"#",tipInfo_on:!1,tipInfo:"<span>&nbsp;&nbsp;跳{currText}/{sumPage}页</span>",tipInfo_css:{width:"22px"},tipSelect_on:!1,tipSelect:"跳转到{select} 共{sumPage}页"}},opts=$.extend(!0,defaults,param);opts.id=obj.attr("id"),obj.addClass(opts.cssStyle),onRequest();var method={};return method.id=opts.id,method.getPage=function(){return opts.currPage},method.onReload=function(){debug("reload()"),onRequest()},method.onLoad=function(e){e&&e instanceof Object&&(debug(e),opts.currPage=1,opts.ajax.param=e.param,onRequest())},method.jumpPage=function(e){debug("jumpPage("+e+")"),e=1>e?1:e,e=e>opts.pageCount?opts.pageCount:e,opts.currPage=e,onRequest()},method}$.fn.myPagination=function(e){return init(e,$(this))},$.fn.debug=function(e){window.console&&window.console.log&&console.log(e)}})(jQuery);