;(function($){
    var URL = 'http://180.76.147.203:8080/getapps';

    if(typeof $ === 'undefined'){
        throw new Error('$ is undefined');
        return;
    }

    $.request = function(opt){
        
        //if (!opt || !opt.url) return;

        var loader = opt.loader === undefined ? true : opt.loader === true;
            
        return $.ajax({
            url: opt.url === undefined ? URL : opt.url,
            cache: opt.cache === undefined ? false : opt.cache === true,
            type: opt.type || "get",
            data: opt.data || {},
            dataType: opt.dataType || "json",
            timeout: opt.timeout || 60000,
            async: opt.async === undefined ? true : opt.async === true,
            beforeSend: function(b) {
                $.isFunction(opt.beforeSend) && opt.beforeSend.call(this, b);
            },
            success: function(b) {
                $.isFunction(opt.success) && opt.success.call(this, b);
            },
            error: function(b, c, d) {
                $.isFunction(opt.error) && opt.error.call(this, b, c, d);
            },
            complete: function() {
                $.isFunction(opt.complete) && opt.complete.call(this);
            }
        });

    };

})($);


$(function(){

    window.app = {
        scrollELement: null,
        listItemTpl: '',
        queryParam: {
            pageid: 1,
            pagenum: 20,
            latitude: "39.912454",
            longitude: "116.404736"
        },
        init: function(se, tpl, type, opt){
            var fun = $.isFunction(fun) ? fun : function(){};
            this.scrollELement = se;
            this.listItemTpl = tpl;
            if(type == 'keyword'){
                this.queryParam[type] = '';
            }else{
                this.queryParam[type] = 1;
            }
            
            this.success = opt.success || function(){};
            this.complete = opt.complete || function(){};
            this.beforeSend = opt.beforeSend || function(){};

            this.bindEvents();
        },
        setQueryParam: function(p){

            $.extend(this.queryParam, p);
        },
        bindEvents: function(){
            var self = this;
            // 请求城市列表
            $.request({
                url: 'http://180.76.147.203:8080/citylist',
                success: function(o){
                    if( $.isArray(o) && o.length > 0){
                        var lis = '';
                        $.each(o, function(i, n){
                            lis +='<li><a href="javascript:;" latitude="'+n.latitude+'" longitude="'+n.longitude+'">'+n.name+'</a></li>';
                        });

                        $('body').append('<div class="layer"></div>');

                        $('.local-list-btn').append(lis).find('a').eq(0)[0].click();
                    }
                }
            });

            //隐藏或者显示城市
            $('.place').bind('click', function(){
                $('body').toggleClass('show-place');
            });

            // 选择城市
            $('.local-list-btn').bind('click', function(e){
                var p = {
                    pageid: 1,
                    pagenum: 20,
                    latitude: "",
                    longitude: ""
                },
                $target = null;

                if(e.target.nodeName.toLowerCase() !== 'a') return ;

                $('a.select', this).removeClass('select');

                $target = $(e.target);

                $('.place span').eq(0).text($target.addClass('select').text());

                $('body').removeClass('show-place');

                p.latitude = $target.attr('latitude') || '';
                p.longitude = $target.attr('longitude') || '';

                $(self.scrollELement).html('');

                self.setQueryParam(p);

                //触发请求
                self.getListData();
            });

            // 滑动加载
            $('.page').bind('scroll', function(){

                if(this.scrollHeight === this.scrollTop + this.clientHeight){
                    if(self.loading) return;

                    self.loading = true;

                    self.getListData();
                }
            });
        },
        getListData: function(){
            var self = this;
            $.request({
                data: this.queryParam,
                beforeSend: function(b) {
                    $.isFunction(opt.beforeSend) && opt.beforeSend.call(this, self, b);
                },
                success: function(o){
                    $.isFunction(self.success) && self.success.call(this, self, o);
                },
                complete: function(){
                    self.loading = false;
                    $.isFunction(opt.complete) && opt.complete.call(this, self);
                }
            });
        },
        encode: function(str){
            var s = "";
            if (!str || str.length == 0) return "";
            s = str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/ /g, "&nbsp;")
                .replace(/\'/g, "&#39;")
                .replace(/\"/g, "&quot;");
            return s;
        },
        decode: function(str){
            var s = "";
            if (!str || str.length == 0) return "";
            s = str.replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&nbsp;/g, " ")
                .replace(/&#39;/g, "\'")
                .replace(/&quot;/g, "\"")
                .replace(/<br>/g, "\n");
            return s;
        }
    }
});