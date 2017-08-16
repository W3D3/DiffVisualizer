/**
 * @file Utility class for various tasks
 * @author Christoph Wedenig <christoph@wedenig.org>
 */
import _ from 'lodash';

/**
 * Utility class for various tasks
 */
class Utility {

  /**
   * splits string at given index and returns both
   * @param {string} value - string to be split
   * @param {integer} index - where it should be splitValue
   * @return {string[]} - array with two elements containing split values
   */
    static splitValue(value, index) {
        var arr = [value.substring(0, index), value.substring(index)];
        return arr;
    }

  /**
   * extracts a given range from a string and returns the string with left and right side
   * @param {string} value - input string
   * @param {integer} start - where the range begins
   * @param {integer} length - how long the range is
   * @return {string[]} - array with 3 elements containing left side, string in range and right side
   */
    static splitRange(value, start, length) {
        var arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
        return arr;
    }

  /**
   * html safe escapes a given range from a string
   * @param {string} value - html unsafe string
   * @param {integer} start - where the range begins
   * @param {integer} length - how long the range is
   * @return {string} - html safe string with range escaped
   */
    static escapeSubpart(value, start, end) {
        var arr = [value.substring(0, start), _.escape(value.substring(start, end)), value.substring(end)];
        return arr.join('');
    }

  // Scrolls to elem inside main
    static scrollToElementRelativeTo(elem, main) {
        if (elem) {
            var t = main.offset().top;
            main.animate({
                scrollTop: elem.offset().top - t
            }, 500);
        } else {
      //console.error('No element found');
        }
    }

  /**
   * Jumps to a line based on 20px line size inside a specific container
   * @example Utility.jumpToLine(120, $('.src')); // jumps to line 120 inside .src
   * @param {integer} lineNumber - the line number to jump to
   * @param {string} container - the jQuery selector element of the container to scroll inside
   */
    static jumpToLine(lineNumber, container) {
        $('span.selectedLine', container.find('.hljs-line-numbers')).contents().unwrap();

        var pixelTop = lineNumber * 20;
        var offset = container.outerHeight() / 2;
        $(container).scrollTo({
            top: pixelTop - offset,
            left: 0
        }, 300);

        if (lineNumber < 1)
            {return;}
        var numbers = container.find('.hljs-line-numbers').html();
        container.find('.hljs-line-numbers').html(numbers.replace(lineNumber, '<span class="selectedLine">' + lineNumber + '</span>'));
    }

  /**
   * gets the type of the opposing codeview
   * @param {string} value - current type (src or dst)
   * @return {string} - opposing type
   */
    static getOpponent(input) {
        if (input == 'src') {
            return 'dst';
        } else if (input == 'dst') {
            return 'src';
        }
    }

    static showNotify(title, message, type, icon, delay) {
        $.notify({
            // options
            icon: icon,
            title: title,
            message: message
        }, {
            // settings
            delay: delay,
            type: type,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            },
            offset: {
                y: 70,
                x: 10
            },
            //showProgressbar: true,
            placement: {
                from: 'top',
                align: 'right'
            },
        });
    }

    static showError(message) {
        Utility.showNotify('Critical Error', message, 'danger', 'glyphicon glyphicon-remove-sign', 0);
    }

    static showMessage(message) {
        Utility.showNotify('', message, 'info', 'glyphicon glyphicon-info-sign', 3000);
    }

    static showWarning(message) {
        Utility.showNotify('', message, 'warning', 'glyphicon glyphicon-alert', 5000);
    }

    static showSuccess(message) {
        Utility.showNotify('', message, 'success', 'glyphicon glyphicon-ok-sign', 2000);
    }

    static changeCodeStyle(style, darkmode) {

        var oldlink = document.getElementById('codestyle');
        var oldmarker = document.getElementById('markerstyle');

        var newlink = document.createElement('link');
        newlink.setAttribute('rel', 'stylesheet');
        newlink.setAttribute('type', 'text/css');
        newlink.setAttribute('id', 'codestyle');
        //TODO change this to local
        newlink.setAttribute('href', 'http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/'+style+'.min.css');

        var newmarker = document.createElement('link');
        newmarker.setAttribute('rel', 'stylesheet');
        newmarker.setAttribute('type', 'text/css');
        newmarker.setAttribute('id', 'markerstyle');

        if(darkmode) {
            newmarker.setAttribute('href', 'css/marker-dark.css');
        } else {
            newmarker.setAttribute('href', 'css/marker-light.css');
        }
        document.getElementsByTagName('head').item(0).replaceChild(newmarker, oldmarker);
        document.getElementsByTagName('head').item(0).replaceChild(newlink, oldlink);
    }

}
export default Utility;
