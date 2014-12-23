;(function($){
    var URL = 'http://180.76.147.203:8080/getapps';

    if(typeof $ === 'undefined'){
        throw new Error('$ is undefined');
        return ;
    }

    $.request = function(opt){
        
        // if (!opt || !opt.url) return;

        var loader = opt.loader === undefined ? false : opt.loader === true;
            
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

                if(loader){

                    $('.loading-layer').show();
                }
            },
            success: function(b) {
                $.isFunction(opt.success) && opt.success.call(this, b);
            },
            error: function(b, c, d) {
                
                $.isFunction(opt.error) && opt.error.call(this, b, c, d);
            },
            complete: function() {
                $.isFunction(opt.complete) && opt.complete.call(this);
                if(loader)
                    window.setTimeout(function(){$('.loading-layer').hide()}, 30);
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
            latitude: "39.912454", // 默认北京坐标
            longitude: "116.404736"
        },

		encodeAppLink: function(appid, link) {
			return "http://180.76.147.203:8080/clicknum?appid=" + appid + "&url=" + encodeURIComponent(link);
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

            $.extend(this.queryParam, this.getLocalPosition());

            // 加载列表数据
            
            if($('.local').height() > 1){
                
                this.getListData();
            }

            this.bindEvents();

            // 定位
            this.locale();

            this.configCityName();

        },
        setQueryParam: function(p){

            $.extend(this.queryParam, p);
        },
        locale:function(){
            var self = this;
            if(!self.getLocalPosition()){
                if( navigator.geolocation ){

                    navigator.geolocation.getCurrentPosition(function(position){
                        var p = {latitude:position.coords.latitude,longitude:position.coords.longitude};

                        self.setLocalPosition(p);

                        //重新获取海报
                        if(typeof self.getPoster == 'function'){
                            self.getPoster();
                        }

                        self.positionCallBack(self.getLocalPosition());

                    }, function(error){
                        //alert('定位失败')
                    });
                }

            }
        },
        positionCallBack: function(position){

            var self = this,
                p = {
                    pageid: 1,
                    pagenum: 20,
                    latitude: "",
                    longitude: ""
                };
            if(position){
                p.latitude = position.latitude;
                p.longitude = position.longitude;
            }else{
                p.latitude = '39.912454';
                p.longitude = '116.404736';
            }

            $(self.scrollElement).html('');

            self.setQueryParam(p);

            self.configCityName();
            
            //触发请求
            self.getListData();
        },
        configCityName: function(){
            // 获取城市名称
            var cname = _getCookie('cityname'),
                p = this.getLocalPosition() || {latitude: "39.912454", longitude: "116.404736"};
            if(cname){
                _setCity(cname);
            }else{
                $.request({
                    url: 'http://180.76.147.203:8080/geolocation?',
                    data: p,
                    dataType: 'text/html',
                    success: function(o){
                        var locationName = $.trim(o);
                        if (locationName&&locationName.lastIndexOf('市') == locationName.length -1 ) {
                            locationName = locationName.slice(0, -1);
                        }
                        _setCity(locationName);
                    }
                });
            }
            
            function _setCity(cityname){
                $('.place span').eq(0).text( cityname || '本地');

                $('.local-list-btn .select').removeClass('select');

                $('.local-list-btn a').each(function(i){
                    if($(this).text() === cityname){
                        $(this).addClass('select');
                        return false;
                    }
                });
                _setCookie('cityname', cityname, 30);
            }
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

                        var text = $('.place span').eq(0).text();

                        $('.local-list-btn').append(lis).find('a').each(function(){
                            if( $(this).text() === text ){
                                $(this).addClass('select');
                                return false;
                            }
                        });
                        
                    }
                }
            });
            
            
            //隐藏或者显示城市
            $('.place').bind('click', function(){
                $('html,body').toggleClass('show-place');
                $('.down-arrow').toggleClass('rotate-arrow');
            });
            // 定位
            $('.local').bind('click', function(){
                self.locale();
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

                /*$('html,body').removeClass('show-place');
                $('.down-arrow').removeClass('rotate');*/
                $('.place').trigger('click');

                p.latitude = $target.attr('latitude') || '';
                p.longitude = $target.attr('longitude') || '';

                $(self.scrollElement).html('')

                self.setQueryParam(p);

                //重新获取海报
                if(typeof self.getPoster == 'function'){
                    self.getPoster();
                }

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
            $(window).bind('scroll', function(){

                if(this.scrollY + screen.height === $('body')[0].scrollHeight){
                    if(self.loading) return;

                    self.loading = true;

                    self.getListData();
                }
            });
        },
        getListData: function(){
            var self = this, loader;

            if( this.queryParam.pageid ==1 && this.queryParam.category){
                loader = true;
            }

            $.request({
                loader: loader,
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
        getLocalPosition: function(){
            var pstr = _getCookie('position');
            if(pstr){
                return JSON.parse(pstr);
            }
            return null;
        },
        setLocalPosition: function(obj){

            var value = JSON.stringify(obj);

            _setCookie('position',value,30);
        }
        
    }
    function _encode(str){
        var s = "";   
        if (!str || str.length == 0) return "";   
        s = str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/ /g, "&nbsp;")
            .replace(/\'/g, "&#39;")
            .replace(/\"/g, "&quot;"); 
        return s;
    }

    function _decode(str){
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

    function _getCookie(c_name){
        if(document.cookie.length>0){
            c_start=document.cookie.indexOf(c_name + "=")
            if(c_start!=-1){ 
                c_start=c_start + c_name.length+1; 

                c_end=document.cookie.indexOf(";",c_start);

                if (c_end==-1) c_end=document.cookie.length;

                return unescape(document.cookie.substring(c_start,c_end));
            } 
        }
        return "";
    }

    function _setCookie(c_name,value,expiredays){
        var exdate=new Date();

        exdate.setDate(exdate.getDate()+expiredays);

        document.cookie=c_name+ "=" +escape(value)+
        ((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
    }
});
