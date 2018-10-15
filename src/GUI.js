/* global $ hljs */
/**
 * @file DOM manipulation that doesn't need context
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import _ from 'lodash';
import DiffDrawer from './DiffDrawer';
import Utility from './Utility';
import {
    client,
} from '../config/default.json';
import domtoimage from './DomToImage';

/**
 * Helper class to keep DiffVisualizer clean.
 * does various things regarding DOM manipulation
 */
class GUI {
    /**
     * Sets up all the GUI tools.
     */
    constructor() {
        GUI.setupMetadataPanel();
        GUI.enableEasterEgg();
        GUI.setupToggleSidebar();
        GUI.setupDiffList();
        GUI.enableIdExpanding();

        this.matcherSelector = $('#matcherID');
        this.styleSelector = $('#themePicker');

        $('.minimap').hide();

        $('#baseurl').text(`(${client.apibase})`);

        // code to print the code View
        $('#printCodebox').click(() => {
            let filename = $('#codeboxTitle b').text();
            if (!filename) {
                filename = 'DiffVisualizer-Screenshot';
                GUI.screenshotCodeView(filename);
            } else {
                filename += '-Screenshot';
                GUI.screenshotCodeView(filename);
            }
        });
    }

    /**
     * Creates an png image of the codeview and download it.
     * @param {string} filename - Name of the image.
     */
    static screenshotCodeView(filename) {
        $('.minimap').hide();
        $('.dst').css('overflow-x', 'visible !important');
        $('#codeboxTitle a').hide();
        let id;
        if (client.screenshotIncludeTitle) {
            id = 'codeView';
        } else {
            id = 'codeContent';
        }
        const node = document.getElementById(id);

        domtoimage.toPng(node, {
            style: {
                overflow: 'visible !important',
            },
            scrollFix: true,
        }).then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();

            $('.minimap').show();
            $('#codeboxTitle a').show();
        }).catch((error) => {
            Utility.showError('Error generating Screenshot: ', error);
        });
    }

    /**
     * Hides metaDataPanel and enables hiding it on header click.
     */
    static setupMetadataPanel() {
        $('#metaDataPanel').hide();
        $('#metaDataPanel .panel-heading').click(() => {
            GUI.hideMetaData();
            DiffDrawer.refreshMinimap();
        });
    }

    /**
     * Binds resizing window and toggling accordion to recalculation of diff list height.
     */
    static setupDiffList() {
    // recalc when resizing window
        $(window).resize(_.debounce(GUI.recalcDiffListHeight, 150));
        // or when something gets toggled in our sidebar
        $('#accordion').on('shown.bs.collapse', () => {
            GUI.recalcDiffListHeight();
        }).on('hidden.bs.collapse', () => {
            GUI.recalcDiffListHeight();
        });
    }

    /**
     * Recalculates diff list height and monaco size.
     */
    static recalcDiffListHeight() {
        const $listPanel = $('#diffsViewer');
        $listPanel.css('height', $(document).height() - $listPanel.offset().top - 30);

        // also resize monaco
        GUI.recalcMonacoSize();
    }

    /**
     * Enables toggle sidebar on button click.
     */
    static setupToggleSidebar() {
        $('#toggleSidebar').click(() => {
            GUI.toggleSidebar(false);
        });
    }

    static toggleSidebar(forceHide) {
        if(forceHide) {
            $('#accordion').hide();
        } else {
            $('#accordion').toggle();
        }
        $('#codeView').toggleClass('col-xs-9');
        $('#codeView').toggleClass('col-xs-12');
        DiffDrawer.refreshMinimap();
        // also resize monaco
        GUI.recalcMonacoSize();
    }

    /**
     * Recalculates monaco editor size if it is visible.
     */
    static recalcMonacoSize() {
        if (!$('.monaco').is(':visible')) {
            // monaco is hidden
            return;
        }
        if (window.editorSrc) {
            window.editorSrc.layout();
        }
        if (window.editorDst) {
            window.editorDst.layout();
        }
    }

    /**
     * Sets monaco minimap visibility.
     * @param {boolean} val - True for enabled minimaps.
     */
    static setMonacoMinimapsVisibility(val) {
        window.editorDst.updateOptions({
            minimap: {
                enabled: val,
            },
        });
        window.editorSrc.updateOptions({
            minimap: {
                enabled: val,
            },
        });
    }

    /**
     * Sets version to show to user.
     * @param {string} version - Version string.
     */
    static setVersion(version) {
        $('.versionNumber').text(version);
    }

    /**
     * Shows metaData Panel and fills it with data.
     * @param {string} title - Title of the metaData.
     * @param {string} content - HTML content of the metaData.
     */
    static showMetaData(title, content) {
        $('#metadataTitle').text(title);
        $('#metadataContent').html(content);

        $('#metaDataPanel').show(() => {
            DiffDrawer.refreshMinimap();
        });
    }

    /**
     * Hides metaDataPanel.
     */
    static hideMetaData() {
        $('#metaDataPanel').hide(600, () => {
            DiffDrawer.refreshMinimap();
        });
    }

    /**
     * Sets source for matcher selector.
     * @param {Matcher[]} matchers - Array of matchers.
     */
    setMatcherSelectionSource(matchers) {
        this.matcherSelector
            .find('option')
            .remove()
            .end();
        for (const item of matchers) {
            this.matcherSelector
                .append($('<option></option>')
                    .attr('value', item.id)
                    .text(item.name));
        }
    }

    /**
     * Sets function to execute when matcher gets changed.
     * @param {function} handler - Handler function.
     */
    setMatcherChangeHandler(handler) {
        this.matcherSelector.on('change', handler);
    }

    /**
     * Forces the matcher to be updated
     */
    forceMatcherUpdate() {
        this.matcherSelector.change();
    }

    /**
     * Sets selected matcher in dropdown.
     * @param {number} id - Matcher id.
     */
    setSelectedMatcher(id) {
        this.matcherSelector.val(id);
    }

    /**
     * Sets function to execute when style gets changed.
     * @param {function} handler - Handler function.
     */
    setStyleChangeHandler(handler) {
        this.styleSelector.on('change', handler);
    }

    /**
     * Sets selected style in dropdown.
     * @param {string} id - Style name.
     */
    setSelectedStyle(id) {
        this.styleSelector.val(id);
        this.styleSelector.trigger('change');
    }

    /**
     * Sets node hover effect for all elements that get selected inside container.
     * @param {string} container - Container selector string where to look inside.
     * @param {string} selector - Selector string to get all elements that need hover effects.
     */
    static setHoverEffect(container, selector) {
        $(container)
            .on('mouseover', selector, function mousover(e) {
                $(this).focus();
                $(this).addClass('hovered');
                $(this).find('.scriptmarker').addClass('subnode');
                e.stopPropagation();
            })
            .on('mouseout', selector, function mouseout(e) {
                $(this).removeClass('hovered');
                $(this).find('.scriptmarker').removeClass('subnode');
                e.stopPropagation();
            });
    }

    /**
     * Enables easter egg when clicking "Diff Visualizer".
     */
    static enableEasterEgg() {
        // totally not an easter egg
        $('.navbar-brand').dblclick(() => {
            $('body').toggleClass('rainbowwrapper');
            $('.badge').toggleClass('rainbowwrapper');
            $('.btn-primary').toggleClass('rainbowwrapper');
        });
    }

    /**
     * Enables id expanding for code header.
     */
    static enableIdExpanding() {
        $('#codeView').on('click', '.id-expand', function toggleExpand(e) {
            const current = $(this).text();
            const fullId = $(this).data('id');

            if (current.length < fullId.length) {
                $(this).text(fullId);
            } else {
                $(this).text(String(fullId).substring(0, 8));
                $(this).slideDown(2000);
            }

            e.stopPropagation();
        });
    }

    /**
     * Uses startCase from lodash to make camalcase strings more readable.
     * @param {string} input - Text to make more readable (preferable camalcase).
     */
    static makeHumanReadable(input) {
        switch (input) {
        case 1:
            return 1;
        default:
            return _.startCase(input);
        }
    }

    /**
     * Hides all codeviewers and shows the editor.
     */
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
        $('#printCodebox').hide();

        $('#changeSource').hide();
        $('#editorControls').show();
    }

    /**
     * Scrolls src monaco to specific line.
     * @param {number} line - Line number to scroll to.
     */
    static srcEditorScrollTop(line) {
        const heightSrc = window.editorSrc.getScrollHeight();
        window.editorSrc.setScrollPosition({scrollTop: heightSrc});
        window.editorSrc.revealLine(line);
    }

    /**
     * Scrolls dst monaco to specific line.
     * @param {number} line - Line number to scroll to.
     */
    static dstEditorScrollTop(line) {
        const heightDst = window.editorDst.getScrollHeight();
        window.editorDst.setScrollPosition({scrollTop: heightDst});
        window.editorDst.revealLine(line);
    }

    /**
     * Hides all editors and shows the viewer.
     */
    static switchToViewer() {
        $('.src').addClass('codebox');
        $('.dst').addClass('codebox');
        $('.src').addClass('hljs');
        $('.dst').addClass('hljs');

        $('.monaco').hide();
        $('.precode').show();
        $('.minimap').show();
        $('#printCodebox').show();

        $('#editorControls').hide();
        $('#changeSource').show();
    }

    /**
     * Deselect current user selection.
     */
    static deselect() {
        if (window.getSelection) {
            if (window.getSelection().empty) { // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) { // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) { // IE?
            document.selection.empty();
        }
    }

    static clearMarkers() {
        $('span.scriptmarker', $('#src')).contents().unwrap();
        $('span.scriptmarker', $('#dst')).contents().unwrap();
    }

    /**
    * Enables/refreshes syntax highlighting and line numbers for all code blocks.
    */
    static enableSyntaxHighlighting() {
        $('pre code').each((i, block) => {
            hljs.highlightBlock(block);
        });

        $('code.hljs-line-numbers').remove();

        $('code.hljs#src').each((i, block) => {
            hljs.lineNumbersBlock(block);
        });
        $('code.hljs#dst').each((i, block) => {
            hljs.lineNumbersBlock(block);
        });
    }
}
export default GUI;
