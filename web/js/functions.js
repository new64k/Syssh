jQuery.changeUrlPar=function(url,par,par_value){
	//为url添加/更改变量名和值，并返回

	var pattern = '[^&^?]*'+par+'=[^&]*';
	var replaceText = par+'='+par_value;
	
	if (url.match(pattern)){
		return url.replace(url.match(pattern), replaceText);
	}else{
		if (url.match('[\?]')){
			return url+'&'+ replaceText;
		}else{
			return url+'?'+replaceText;
		}
	}

	return url+'\n'+par+'\n'+par_value;
};

jQuery.unsetURLPar=function(url,par){
	//删除url中的指定变量，并返回
	var regUnsetPara=new RegExp('\\?'+par+'$|\\?'+par+'=[^&]*$|'+par+'=[^&]*\\&*|'+par+'&|'+par+'$');
	return url.replace(regUnsetPara,'');
};

/*扩展jQuery工具函数库*/
jQuery.showMessage=function(message,type,directExport){
	if(!directExport){
		var directExport=false;
	}

	if(directExport){
		var newMessage=$(message);
	}else{
		if(type==='warning'){
			var notice_class='ui-state-error';
			var notice_symbol='<span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span>';
		}else{
			var notice_class='ui-state-highlight';
			var notice_symbol='<span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>';
		}
		var newMessage = $('<span class="message ui-corner-all ' + notice_class + '" title="点击隐藏提示">' + notice_symbol + message + '</span>');
	}

	newMessage.appendTo('body');
	
	$.processMessage();

};

jQuery.processMessage=function(){
	var noticeEdge=50;
	var lastNoticeHeight=0;
	$('.message').each(function(index,element){
		$(this).css('top',noticeEdge+lastNoticeHeight+'px');
		lastNoticeHeight+=$(this).height()+30;
	});

	$('.message').click(function(){
		$(this).stop(true).fadeOut(200,function(){
			$(this).remove();
			$.processMessage();
		});
	}).each(function(index,Element){
		$(this).delay(index*3000).fadeOut(20000,function(){
			$(this).remove();
		});
	}).mouseenter(function(){
		$(this).stop(true).dequeue().css('opacity',1);
	}).mouseout(function(){
		$(this).fadeOut(10000);
	});
};

jQuery.parseMessage=function(messages){
	if(messages){
		$.each(messages,function(messageType,messages){
			$.each(messages,function(index,message){
				$.showMessage(message,messageType);
			});
		});
	}
};

/*扩展jQuery对象函数*/
jQuery.fn.getOptionsByLabelRelative=function(labelName,callback){
	var select=$(this);
	
	$.get('/label/getrelatives/'+labelName,function(response){
		var options='';
		$.map(response.data,function(item){
			options+='<option value="'+item+'">'+item+'</option>';
		});
		select.html(options).trigger('change');
		if (typeof callback !== 'undefined'){
			callback(passive_select.val());
		}
	});
};

/**
 *根据一个后台返回的响应
 *（包含status, message, data属性. 其中，data为多个如下结构的对象type, content, selector, method）
 *中包含的信息，对当前页面进行部分再渲染
 *
 */
jQuery.fn.setBlock=function(response){
	
	var parent=this;
	
	if(response.status==='login'){
		window.location.href='login';
		return this;
	}

	else if(response.status==='redirect'){
		$.redirect(response.data);
		return this;
	}
	
	else if(response.status==='refresh'){
		$.refresh(hash);
		return this;
	}
	
	else if(response.status==='redirect_href'){
		window.location.href='/'+response.data;
		return this;
	}
	
	$.parseMessage(response.message);
	
	if(response.status==='fail'){
		return;
	}

	$.each(response.data,function(dataName,data){
		
		var block;
		
		if(!data){
			return;
		}
		
		if(data.type==='script'){
			eval(data.content);
		}
		
		else if(data.method==='replace'){
			if(data.selector){
				var grandParent=parent.parent();
				if(parent.is(data.selector)){
					parent.replaceWith(data.content);
					block=grandParent.children(data.selector).trigger('blockload');
				}else{
					parent.find(data.selector).replaceWith(data.content);
					block=parent.find(data.selector).trigger('blockload');
				}
			}
		}else{
			if(data.selector){
				
				if(parent.is(data.selector)){
					if(data.method==='append'){
						block=parent.append(data.content).trigger('blockload');
					}else{
						block=parent.html(data.content).trigger('blockload');
					}
				}else{
					if(data.method==='append'){
						block=parent.find(data.selector).append(data.content).trigger('blockload');
					}else{
						block=parent.find(data.selector).html(data.content).trigger('blockload');
					}
				}				
			}
		}
				
		/*如果数据是主页面内容，则标记载入时间，触发特定事件*/
		if(block !== undefined){
			if(dataName==='content'){
				block.trigger('sectionload').attr('time-load',$.now());
			}

			if(dataName==='sidebar' || data.type==='sidebar'){
				block.trigger('sidebarload');
			}
			if(data.type==='content-table'){
				block.trigger('contenttableload');
			}
		}
	});
	
	return this;
};

jQuery.fn.reset=function(){
	$(this).find(':input').val('');
	$(this).find('select').find('option').removeAttr('checked');
	$(this).find(':checkbox, :radio').removeAttr('checked');
};

/**
 * 关闭当前标签选项卡并回到之前访问的选项卡
 * 如果没有之前访问的选项卡，则打开默认页面
 */
jQuery.closeTab=function(hash){
	
	var uriSegments=hash.split('/');
	
	if(typeof uriSegments[2] !=='undefined'){
		$.get('/'+uriSegments[0]+'/submit/cancel/'+uriSegments[2]);
	}
	
	tabs.children('li[for="'+hash+'"]').remove();
	page.children('section[hash="'+hash+'"]').remove();
	aside.children('section[for="'+hash+'"]').remove();

	var lastAccessedHash;
	var lastAccessTime=0;

	var sections = page.children('section').each(function(){
		if($(this).attr('time-access')>lastAccessTime){
			lastAccessedHash=$(this).attr('hash');
			lastAccessTime=$(this).attr('time-access');
		}
	}).length;

	if(sections>0){
		$.locationHash(lastAccessedHash);
	}else{
		$.locationHash(page.attr('default-uri'));
	}
	
};

/**
 * 关闭当前标签选项卡并打开一个新的标签选项卡
 */
jQuery.redirect=function(newhash){
	tabs.children('li[for="'+hash+'"]').remove();
	page.children('section[hash="'+hash+'"]').remove();
	aside.children('section[for="'+hash+'"]').remove();
	$.locationHash(newhash);
};

jQuery.refresh=function(hash){
	$.get(hash);
};

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}
		if(type === undefined){
			type='json';
		}

		return jQuery.ajax({
			type: method,
			url: url,
			data: data,
			success: function(data,textStatus,jqXHR){
				$.isFunction(callback) && callback(data,textStatus,jqXHR);
				$(document).setBlock(data);
			},
			dataType: type,
			beforeSend:function(){
				throbber.fadeIn(500).rotate({animateTo:18000,duration:100000});
			},
			complete:function(){
				throbber.stop().fadeOut(200).stopRotate();
			},
			error:function(){
				$.showMessage('服务器返回了错误的数据','warning');
			}
		});
	};
});