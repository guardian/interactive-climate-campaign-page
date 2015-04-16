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
        var currenturl = document.location.href;
        if(currenturl.indexOf('campaign=')>-1){
            var value = currenturl.split('campaign=')[1];
            tickerId = value.split(/#|&/)[0];
        }
        $.ajax({
            url: 'http://interactive.guim.co.uk/spreadsheetdata/1ksoSBOclYmbSWCX8YbNBsnfyNBD22SVg72Ktrq4PJaA.json',
            success: function(response){
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

        app.on('shareContainer.share',shareContent)
    }

    function shareContent(e, platform, message, url, image){
        var shareWindow;
        var twitterBaseUrl = "http://twitter.com/share?text=";
        var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
        
        var articleUrl = "http://theguardian.com/keep-it-in-the-ground"
        var facebookUrl = "http://www.theguardian.com/environment/ng-interactive/2015/mar/16/keep-it-in-the-ground-guardian-climate-change-campaign";
        var urlsuffix = url ? url : "";
        var shareUrl = articleUrl + urlsuffix;

        var fallbackMessage = "Keep it in the ground: Guardian climate change campaign pic.twitter.com/GBU5LKb4yY";
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
