;(function($){
    var URL = 'http://180.76.147.203:8080/getapps';

    if(typeof $ === 'undefined'){
        throw new Error('$ is undefined');
        return ;
    }

    $.request = function(opt){
        
        // if (!opt || !opt.url) return;

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
                $.isFunction(opt.beforeSend) && opt.beforeSend.call(this, b)
                
            },
            success: function(b) {
                $.isFunction(opt.success) && opt.success.call(this, b);
            },
            error: function(b, c, d) {
                
                $.isFunction(opt.error) && opt.error.call(this, b, c, d)
            },
            complete: function() {
                
                $.isFunction(opt.complete) && opt.complete.call(this)
            }
        });

    }

})($);


$(function(){

    window.app = {
        scrollElement: null,
        listItemTpl: '',
        queryParam: {
            pageid: 1,
            pagenum: 20,
            latitude: "",
            longitude: ""
        },
        init: function(se, tpl, type, opt){
            var fun = $.isFunction(fun) ? fun : function(){};
            this.scrollElement = se;
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

                        $('<div class="layer"></div>').appendTo('body').bind({
                            'touchstart':function(e){
                                e.stopPropagation();
                            },
                            'touchmove':function(e){
                                e.stopPropagation();
                            },
                            'click':function(){
                                $('.place').trigger('click');
                            }
                        });

                        $('.local-list-btn').append(lis)/*.find('a').eq(0)[0].click()*/;
                        if($('.local').height() > 1){
                            $('.local').trigger('click');
                        }
                    }
                }
            });
            
            
            //隐藏或者显示城市
            $('.place').bind('click', function(){
                $('html,body').toggleClass('show-place');
            });
            // 定位
            $('.local').bind('click', function(){

                if(navigator.geolocation){

                    navigator.geolocation.getCurrentPosition(function(position){
                        
                        positionCallBack(position);

                    }, function(error){

                        positionCallBack();
                    });

                }else{
                    positionCallBack();
                }

                function positionCallBack(position){
                    var p = {
                        pageid: 1,
                        pagenum: 20,
                        latitude: "",
                        longitude: ""
                    };
                    if(position&&position.coords){
                        p.latitude = position.coords.latitude;
                        p.longitude = position.coords.longitude;
                    }else{
                        p.latitude = '39.912454';
                        p.longitude = '116.404736';
                    }

                    $(self.scrollElement).html('');

                    self.setQueryParam(p);

                    // 获取城市名称
                    $.request({
                        url: 'http://180.76.147.203:8080/geolocation?',
                        data: {
                            longitude: p.longitude,
                            latitude: p.latitude
                        },
                        dataType: 'text/html',
                        success: function(o){
                            console.log(o);
                            var locationName = $.trim(o);
                            if (locationName&&locationName.lastIndexOf('市') == locationName.length -1 ) {
                                locationName = locationName.slice(0, -1);
                            };
                            $('.place span').eq(0).text( locationName || '本地');

                            $('.local-list-btn .select').removeClass('select');

                            $('.local-list-btn a').each(function(i){
                                if($(this).text() === locationName){
                                    $(this).addClass('select');
                                    return false;
                                }
                            });
                        }
                    });
                    
                    //触发请求
                    self.getListData();
                }
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

                $('html,body').removeClass('show-place');

                p.latitude = $target.attr('latitude') || '';
                p.longitude = $target.attr('longitude') || '';

                $(self.scrollElement).html('')

                self.setQueryParam(p);

                //触发请求
                self.getListData();

            }).bind({
                'touchstart':function(e){
                    e.stopPropagation();
                },
                'touchmove':function(e){
                    e.stopPropagation();
                }
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
                data: self.queryParam,
                beforeSend: function(b) {
                    $.isFunction(self.beforeSend) && self.beforeSend.call(this, self, b)
                },
                success: function(o){
                    $.isFunction(self.success) && self.success.call(this, self, o);
                },
                complete: function(){
                    self.loading = false;
                    $.isFunction(self.complete) && self.complete.call(this, self)
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