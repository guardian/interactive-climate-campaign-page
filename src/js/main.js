define([
    'ractive',
    'jquery',
    'text!./templates/appTemplate.html',
    'text!./templates/headerTemplate.html',
    'text!./templates/footerTemplate.html',
    'text!./templates/chapters/petitionTemplate.html',
    'text!./templates/chapters/noteTemplate.html',
    'text!./templates/chapters/explainerTemplate.html',
    'text!./templates/chapters/actionTemplate.html',
    'text!./templates/chapters/updatesTemplate.html',
    './ractive-events-tap.js',
], function(
    Ractive,
    $,
    appTemplate,
    headerTemplate,
    footerTemplate,
    petitionTemplate,
    noteTemplate,
    explainerTemplate,
    actionTemplate,
    updatesTemplate
) {
   'use strict';
    
    var data;

    function init(el, context, config, mediator) {
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
                console.log(data.actions);
                renderPage(el);
            }
        })
    }

    function renderPage(el){
        var appHeader           = Ractive.extend({template:headerTemplate});
        var appFooter           = Ractive.extend({template:footerTemplate});

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
            console.log(data);
            app.update('faq');
        })
    }

    return {
        init: init
    };
});
