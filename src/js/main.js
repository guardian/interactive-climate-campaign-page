define([
    'ractive',
    'jquery',
    'text!./templates/appTemplate.html',
    'text!./templates/headerTemplate.html',
    'text!./templates/footerTemplate.html',
    'text!./templates/shareTemplate.html',
    'text!./templates/chapters/petitionTemplate.html',
    'text!./templates/chapters/noteTemplate.html',
    'text!./templates/chapters/explainerTemplate.html',
    'text!./templates/chapters/actionTemplate.html',
    'text!./templates/chapters/updatesTemplate.html',
    './ractive-events-tap.js',
    'jQuery.XDomainRequest'
], function(
    Ractive,
    $,
    appTemplate,
    headerTemplate,
    footerTemplate,
    shareTemplate,
    petitionTemplate,
    noteTemplate,
    explainerTemplate,
    actionTemplate,
    updatesTemplate
) {
   'use strict';
    
    var data;
    var tickerId = "";

    function init(el, context, config, mediator) {
        resetMobile();
        var headCount = -1;
        var currenturl = document.location.href;
        if(currenturl.indexOf('campaign=')>-1){
            var value = currenturl.split('campaign=')[1];
            tickerId = value.split(/#|&/)[0];
        }
        $.ajax({
            url: 'https://interactive.guim.co.uk/docsdata-test/1MPqC3c6l8wEYWZMBNOx2vKLUz09WAQk5Ml2P03zdMr0.json',
            success: function(response){
                console.log(response)
                for(var key in response.sheets){
                    var newSheet = response.sheets[key].map(function(row){
                        if(row.text){
                            row.text = row.text.split('\n').filter(function(p){return p});
                        }
                        return row;
                    });
                    response.sheets[key] = newSheet;
                }

                response.sheets.actions = response.sheets.actions.map(function(a){
                    headCount++;
                    var splitHeadline = a.headline.split(': ');
                        if(splitHeadline.length > 1){
                            a.headline = {
                                subtitle: splitHeadline[0],
                                title: splitHeadline[1]
                            }
                        }else{
                            a.headline = {
                                title: splitHeadline[0]
                            }
                        }
                    a.count = headCount;

                    return a;
                })
                data = response.sheets;
                data.tickerId = tickerId;
                
                $.ajax({
                    type:'GET',
                    dataType:'json',
                    url:'http://350dotorg.github.io/megamap-data/count-all-guardian-petition-signers-including-translations.json',
                    timeout:2000,
                    error:function(err){
                        data.petitionAmount = "";
                    },
                    success:function(resp){
                        var remaining = resp.count % 1000;
                        var rounded = resp.count - remaining;
                        data.petitionAmount = (rounded/1000)
                            .toFixed(3)
                            .toString()
                            .replace('.',',');
                    },
                    complete:function(){
                        renderPage(el);                   
                    }
                })
            },
            error:function(err){
                // console.log('data not loading',err);
            }
        })
    }

    function renderPage(el){
        var appHeader           = Ractive.extend({template:headerTemplate});
        var appFooter           = Ractive.extend({template:footerTemplate});
        var shareContainer      = Ractive.extend({template:shareTemplate});

        var chapterPetition     = Ractive.extend({template:petitionTemplate});
        var chapterNote         = Ractive.extend({template:noteTemplate});
        var chapterExplainer    = Ractive.extend({template:explainerTemplate});
        var chapterAction       = Ractive.extend({template:actionTemplate});
        var chapterUpdates      = Ractive.extend({template:updatesTemplate});

        var addEvent = function(object, type, callback) {
            if (object == null || typeof(object) == 'undefined') return;
            if (object.addEventListener) {
                object.addEventListener(type, callback, false);
            } else if (object.attachEvent) {
                object.attachEvent("on" + type, callback);
            } else {
                object["on"+type] = callback;
            }
        };


        var app = new Ractive({
            el:el,
            template:appTemplate,
            components: {
                appHeader:appHeader,
                appFooter:appFooter,
                shareContainer:shareContainer,
                chapterPetition:chapterPetition,
                chapterNote:chapterNote,
                chapterExplainer:chapterExplainer,
                chapterAction:chapterAction,
                chapterUpdates:chapterUpdates
            },
            data:data

        })

        app.on('chapterExplainer.flagQuestion',function(e){
            data.faq = data.faq.map(function(q){
                q.flag = "";
                return q;
            })
            e.context.flag="true";
            app.update('faq');
            var scrollHeight = $('#faq').offset().top;
            window.scrollTo(0,scrollHeight);
        })

        addEvent(window, "resize", checkForResize );

        app.on('shareContainer.share',shareContent);

        adjustLayout();
    }

    function checkForResize(){
        adjustLayout();
    }

    function adjustLayout(){
        var el = document.getElementById("navContainer");
        
        var style = window.getComputedStyle(el); 
        var n = getCSSVal("navContainer","margin-left");
        var nn = getCSSVal("mainContent","padding-left");
        var nnn = getCSSVal("petitionContainer","padding-left");
        
        var k = parseInt(n.substring(0, n.length - 2));
        var kk = parseInt(nn.substring(0, nn.length - 2));
        var kkk = parseInt(nnn.substring(0, nn.length - 2));

        console.log(k+kk)

        adjustHeader((k+kk+kkk))
    }

    function adjustHeader(n){
         
         //n = n*-1;
         
         document.getElementById("stackTwo").style.borderLeft = n+"px solid #005689";
         
    }

    function getCSSVal(idStr,cssVal){
        var n;
            var el = document.getElementById(idStr);
            var style = window.getComputedStyle(el); 

            n = style.getPropertyValue(cssVal);

        return n;
    }

    function shareContent(e, platform, message, url, image){
        var shareURL = "http://gu.com/p/4ft63"; // short url will only work in a guardian page
        var shareWindow;
        var twitterBaseUrl = "http://twitter.com/share?text=";
        var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
        
        var articleUrl = shareURL;
        var facebookUrl = shareURL;
        var urlsuffix = url ? url : "";
        var shareUrl = articleUrl + urlsuffix;

        var fallbackMessage = "The story of one of the most complex organisations in the world, the voices of those on the frontline #ThisIsTheNHS";
        message = message ? message : fallbackMessage;
        
        var shareImagePath = "@@assetPath@@/imgs/";
        var shareImage = image ? shareImagePath + image : shareImagePath + 'logo.png'

        
        
         
        if(platform === "twitter"){
            shareWindow = 
                twitterBaseUrl + 
                encodeURIComponent(message) + 
                "&url=" + 
                encodeURIComponent(shareUrl)   
        }else if(platform === "facebook"){
            shareWindow = 
                facebookBaseUrl + 
                encodeURIComponent(facebookUrl) + 
                "&picture=" + 
                encodeURIComponent(shareImage) + 
                "&redirect_uri=http://www.theguardian.com";
        }else if(platform === "mail"){
            shareWindow =
                "mailto:" +
                "?subject=" + message +
                "&body=" + shareUrl 
        }
        window.open(shareWindow, platform + "share", "width=640,height=320");
    }

  

    function resetMobile(){
        $('#standard-article-container').addClass('interactiveStyling');
    }
    return {
        init: init
    };
});
