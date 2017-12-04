/* global $ ace */
/**
 * @file DOM manipulation that doesn't need context
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

/**
 * Helper class to keep DiffVisualizer clean.
 * does various things regarding DOM manipulation
 */
import DiffDrawer from './DiffDrawer';
import Utility from './Utility';
import _ from 'lodash';
import {
  client
} from '../config/default.json';
import domtoimage from './DomToImage';

class GUI {

    constructor() {
        this.setupMetadataPanel();
        this.enableEasterEgg();
        this.setupToggleSidebar();
        this.setupDiffList();
        this.enableIdExpanding();

        this.matcherSelector = $('#matcherID');
        this.styleSelector = $('#themePicker');

        $('.minimap').hide();

        $('#baseurl').text('(' + client.apibase + ')');

        //code to print the code View
        $('#printCodebox').click(function () {
            var filename = $('#codeboxTitle b').text();
            if(!filename) {
                filename = 'DiffVisualizer-Screenshot';
                GUI.screenshotCodeView(filename);
            }
            else{
                filename = filename + '-Screenshot';
                GUI.screenshotCodeView(filename);
            }

        });
    }

    static screenshotCodeView(filename) {
        $('.minimap').hide();
        $('.dst').css('overflow-x', 'visible !important');
        $('#codeboxTitle a').hide();
        var id;
        if(client.screenshotIncludeTitle) {
            id = 'codeView';
        } else {
            id = 'codeContent';
        }
        var node = document.getElementById(id);

        domtoimage.toPng(node, {
            style: {
                overflow: 'visible !important'
            },
            scrollFix: true
        }).then(function(dataUrl) {
            var link = document.createElement('a');
            link.download = filename + '.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();

            $('.minimap').show();
            $('#codeboxTitle a').show();
        }).catch(function(error) {
            Utility.showError('Error generating Screenshot: ', error);
        });
    }

    setupMetadataPanel() {
        $('#metaDataPanel').hide();
        $('#metaDataPanel .panel-heading').click(function() {
            GUI.hideMetaData();
            DiffDrawer.refreshMinimap();
        });
    }

    setupDiffList() {
    // recalc when resizing window
        $(window).resize(_.debounce(GUI.recalcDiffListHeight, 150));
    // or when something gets toggled in our sidebar
        $('#accordion').on('shown.bs.collapse', function() {
            GUI.recalcDiffListHeight();
        }).on('hidden.bs.collapse', function() {
            GUI.recalcDiffListHeight();
        });
    }

    static recalcDiffListHeight() {
        var $listPanel = $('#diffsViewer');
        $listPanel.css('height', $(document).height() - $listPanel.offset().top - 30);

        //also resize monaco
        GUI.recalcMonacoSize();
    }

    setupToggleSidebar() {
        $('#toggleSidebar').click(function() {
            $('#accordion').toggle();
            $('#codeView').toggleClass('col-xs-9');
            $('#codeView').toggleClass('col-xs-12');
            DiffDrawer.refreshMinimap();
            //also resize monaco
            GUI.recalcMonacoSize();
        });
    }

    static recalcMonacoSize() {
        if(!$('.monaco').is(':visible')) {
            console.log('hidden');
            return;
        }
        if(window.editorSrc) {
            window.editorSrc.layout();
        }
        if(window.editorDst) {
            window.editorDst.layout();
        }
    }

    setVersion(version) {
        $('.versionNumber').text(version);
    }

    static showMetaData(title, content) {
        // var elem = $('#' + title).clone().css('border', '');
        $('#metadataTitle').text(title);
        $('#metadataContent').html(content);
        // $('#metadataContent').append('<br />');
        // $('#metadataContent').append(elem);

        $('#metaDataPanel').show(function() {
            DiffDrawer.refreshMinimap();
        });
    }

    static hideMetaData() {
        $('#metaDataPanel').hide(600, function(){
            DiffDrawer.refreshMinimap();
        });

    }

    static initializeEditor(id, theme, language) {
        var editor = ace.edit(id);
        editor.setTheme(`ace/theme/${theme}`);
        editor.getSession().setMode(`ace/mode/${language}`);
        editor.resize();
        editor.$blockScrolling = Infinity;
        return editor;
    }

    setMatcherSelectionSource(matchers) {
        for (let item of matchers) {
            this.matcherSelector
        .append($('<option></option>')
          .attr('value', item.id)
          .text(item.name));
        }
    }

    setMatcherChangeHandler(handler) {
        this.matcherSelector.on('change', handler);
    }

    setSelectedMatcher(id) {
        this.matcherSelector.val(id);
    }

    setStyleChangeHandler(handler) {
        this.styleSelector.on('change', handler);
    }

    setSelectedStyle(id) {
        this.styleSelector.val(id);
        this.styleSelector.trigger('change');
    }

    setHoverEffect(container, selector) {
        $(container)
          .on('mouseover', selector, function(e) {
            // console.log( 'mouse over ' + $(this).attr('id'));
              $(this).focus();
            //   $(this).css('border', 'black 1px dashed');
              $(this).addClass('hovered');
              $(this).find('.scriptmarker').addClass('subnode');
              e.stopPropagation();
          })
          .on('mouseout', selector, function(e) {
            // console.log( 'mouse out ' + $(this).attr('id'));
            //   $(this).css('border', '');
              $(this).removeClass('hovered');
              $(this).find('.scriptmarker').removeClass('subnode');
              e.stopPropagation();
          });
    }



    enableEasterEgg() {
    // totally not an easter egg
        $('.navbar-brand').dblclick(function() {
            $('body').toggleClass('rainbowwrapper');
            $('.badge').toggleClass('rainbowwrapper');
            $('.btn-primary').toggleClass('rainbowwrapper');
        });
    }

    enableIdExpanding() {
        $('#codeView').on('click', '.id-expand', function(e) {

            var current = $(this).text();
            var fullId = $(this).data('id');

            if(current.length < fullId.length) {
                $(this).text(fullId);
            } else {
                $(this).text(String(fullId).substring(0,8));
                $(this).slideDown(2000);
            }

            e.stopPropagation();
        });
    }

    static makeHumanReadable(input) {
        switch (input) {

        case 1:
            return 1;
        default:
            return _.startCase(input);

        }

    }

    static switchToEditor() {
        $('.src').removeClass('codebox');
        $('.dst').removeClass('codebox');
        $('.src').removeClass('hljs');
        $('.dst').removeClass('hljs');

        $('.monaco').show();
        window.editorSrc.layout();
        window.editorDst.layout();
        $('.precode').hide();
        $('.minimap').hide();

        $('#changeSource').hide();
        $('#saveSource').show();
    }

    static switchToViewer() {
        $('.src').addClass('codebox');
        $('.dst').addClass('codebox');
        $('.src').addClass('hljs');
        $('.dst').addClass('hljs');

        $('.monaco').hide();
        $('.precode').show();
        $('.minimap').show();

        $('#saveSource').hide();
        $('#changeSource').show();
    }

}
export default GUI;
