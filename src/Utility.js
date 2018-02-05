/* global $ */
/**
 * @file Utility class for various tasks
 * @author Christoph Wedenig <christoph@wedenig.org>
 */
import _ from 'lodash';
import moment from 'moment';
import FileExt from './FileExt';

/**
 * Utility class for various tasks
 */
class Utility {
    /**
    * Splits string at given index and returns both.
    * @param {string} value - String to be split.
    * @param {integer} index - Where it should be splitValue.
    * @returns {string[]} - Array with two elements containing split values.
    */
    static splitValue(value, index) {
        const arr = [value.substring(0, index), value.substring(index)];
        return arr;
    }

    /**
    * Extracts a given range from a string and returns the string with left and right side.
    * @param {string} value - Input string.
    * @param {integer} start - Where the range begins.
    * @param {integer} length - How long the range is.
    * @returns {string[]} - Array with 3 elements containing left side, string in range and right side.
    */
    static splitRange(value, start, length) {
        const arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
        return arr;
    }

    /**
    * HTML safe escapes a given range from a string.
    * @param {string} value - HTML unsafe string.
    * @param {integer} start - Where the unsafe range begins.
    * @param {integer} end - Where the unsafe range ends.
    * @returns {string} - HTML safe string with range escaped.
    */
    static escapeSubpart(value, start, end) {
        const arr = [value.substring(0, start), _.escape(value.substring(start, end)), value.substring(end)];
        return arr.join('');
    }

    /**
    * Scrolls to elem inside container.
    * @param {jQuery Selector} elem - Element to scroll to.
    * @param {jQuery Selector} main - Container to scroll.
    */
    static scrollToElementRelativeTo(elem, main) {
        if (elem) {
            const t = main.offset().top;
            main.animate({
                scrollTop: elem.offset().top - t,
            }, 500);
        } else {
            // console.error('No element found');
        }
    }

    /**
    * Jumps to a line based on 20px line size inside a specific container.
    * @example Utility.jumpToLine(120, $('.src')); // Jumps to line 120 inside .src
    * @param {integer} lineNumber - The line number to jump to.
    * @param {string} container - The jQuery selector string of the container to scroll inside.
    */
    static jumpToLine(lineNumber, container) {
        $('span.selectedLine', container.find('.hljs-line-numbers')).contents().unwrap();

        const pixelTop = lineNumber * 20; // hardcoded line height here
        const offset = container.outerHeight() / 2;
        $(container).scrollTo({
            top: pixelTop - offset,
            left: 0,
        }, 300);

        if (lineNumber < 1) {
            return;
        }
        const numbers = container.find('.hljs-line-numbers').html();
        container.find('.hljs-line-numbers').html(numbers.replace(lineNumber, `<span class="selectedLine">${lineNumber}</span>`));
    }

    /**
    * Gets the type of the opposing codeview.
    * @param {string} input - Current type (src or dst).
    * @returns {string} - Opposing type.
    */
    static getOpponent(input) {
        if (input === 'src') {
            return 'dst';
        } else if (input === 'dst') {
            return 'src';
        }
        return 'src';
    }

    /**
    * Shows top right notification with some settings.
    * @param {string} title - Bold text before the message.
    * @param {string} message - Notification content.
    * @param {string} type - Bootrap class prefix for styling (info, warning, error etc.).
    * @param {string} icon - CSS class of icon (glyph or fontawesome).
    * @param {string} delay - Time until notification fades out (0 is never).
    */
    static showNotify(title, message, type, icon, delay) {
        $.notify({
            // options
            icon,
            title,
            message,
        }, {
            // settings
            delay,
            type,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp',
            },
            offset: {
                y: 70,
                x: 10,
            },
            // showProgressbar: true,
            placement: {
                from: 'top',
                align: 'right',
            },
            z_index: 999999,
        });
    }

    /**
    * Shows top right error notification.
    * @param {string} message - Notification content.
    */
    static showError(message) {
        Utility.showNotify('Critical - ', message, 'danger', 'glyphicon glyphicon-remove-sign', 0);
    }

    /**
    * Shows top right default notification.
    * @param {string} message - Notification content.
    */
    static showMessage(message) {
        Utility.showNotify('', message, 'info', 'glyphicon glyphicon-info-sign', 3000);
    }

    /**
    * Shows top right warning notification.
    * @param {string} message - Notification content.
    */
    static showWarning(message) {
        Utility.showNotify('', message, 'warning', 'glyphicon glyphicon-alert', 5000);
    }

    /**
    * Shows top right success notification.
    * @param {string} message - Notification content.
    */
    static showSuccess(message) {
        Utility.showNotify('', message, 'success', 'glyphicon glyphicon-ok-sign', 2000);
    }

    /**
    * Changes the style of the codeboxes.
    * @param {string} style - Valid hljs style (https://highlightjs.org/static/demo/).
    * @param {boolean} darkmode - True for dark background and different node coloring.
    * @param {boolean} local - If style is no valid hljs style, stylesheet will be chosen from local css folder if local is set.
    */
    static changeCodeStyle(style, darkmode, local) {
        const oldlink = document.getElementById('codestyle');
        const oldmarker = document.getElementById('markerstyle');
        const newlink = document.createElement('link');

        newlink.setAttribute('rel', 'stylesheet');
        newlink.setAttribute('type', 'text/css');
        newlink.setAttribute('id', 'codestyle');

        // TODO change this to local
        if (!local) {
            newlink.setAttribute('href', `http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/${style}.min.css`);
        } else {
            newlink.setAttribute('href', `css/${style}.css`);
        }

        const newmarker = document.createElement('link');
        newmarker.setAttribute('rel', 'stylesheet');
        newmarker.setAttribute('type', 'text/css');
        newmarker.setAttribute('id', 'markerstyle');

        if (darkmode) {
            newmarker.setAttribute('href', 'css/marker-dark.css');
        } else {
            newmarker.setAttribute('href', 'css/marker-light.css');
        }

        document.getElementsByTagName('head').item(0).replaceChild(newmarker, oldmarker);
        document.getElementsByTagName('head').item(0).replaceChild(newlink, oldlink);
    }

    /**
    * Converts date to time ago string.
    * @param {string} date - ISO 8601 date string.
    * @returns {string} - Time ago string.
    */
    static timeAgoString(date) {
        const d = moment(date);
        moment.locale('en');
        return d.calendar(null, {
            // sameDay: '[Today]',
            // nextDay: '[Tomorrow]',
            // nextWeek: 'dddd',
            // lastDay: '[Yesterday]',
            // lastWeek: '[Last] dddd',
            sameElse: 'DD.MM.YYYY',
        });
    }

    /**
    * Converts an object/array into JSON and downloads it on the client.
    * @param {string} filename - The name of the downloaded file.
    * @param {Object} content - Object/Array to download as JSON.
    */
    static startJSONDownload(filename, content) {
        const a = window.document.createElement('a');
        const contentFiltered = _.without(content, undefined);
        a.href = window.URL.createObjectURL(new Blob([JSON.stringify(contentFiltered)], {type: 'text/json'}));
        a.download = `${filename}.json`;

        // Append anchor to body.
        document.body.appendChild(a);
        a.click();

        // Remove anchor from body
        document.body.removeChild(a);
    }

    /**
     * Converts filename into Language and sets it globally for editor and viewer.
     * @param {String} filename The filename of the file with an extention after the last dot.
     */
    static setLanguageFromFilename(filename) {
        const fileExt = filename.toLowerCase().split('.').pop();
        console.log(fileExt);
        const converter = new FileExt();
        console.log(converter.getLanguageForExt(fileExt));
        Utility.changeLanguageGlobally(converter.getLanguageForExt(fileExt), fileExt);
    }

    /**
     * Changes the language globally for editor and viewer.
     * @param {String} languageName Monaco supported language name (https://github.com/Microsoft/monaco-languages).
     * @param {String} ext Valid extention and therfore valid hljs class name.
     */
    static changeLanguageGlobally(languageName, ext) {
        // remove previous languages from 2 codeboxes with highlight.js
        // $('#src').removeClass((index, className) => {
        //     return (className.match(/(^|\s)\S+/g) || []).join(' ');
        // });
        $('#src').removeClass();
        $('#dst').removeClass();
        $('#src').addClass(`language-${ext}`);
        $('#dst').addClass(ext);
        // GUI.enableSyntaxHighlighting(); // This also refreshes Syntax highlighting

        // monaco language setting
        const modelSrc = window.editorSrc.getModel();
        const modelDst = window.editorDst.getModel();
        monaco.editor.setModelLanguage(modelSrc, languageName);
        monaco.editor.setModelLanguage(modelDst, languageName);
    }
}
export default Utility;
