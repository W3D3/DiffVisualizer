import _ from 'lodash';

class Utility {

  //utility functions
  static splitValue(value, index) {
    var arr = [value.substring(0, index), value.substring(index)];
    return arr;
  }

  static splitRange(value, start, length) {
    var arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
    return arr;
  }

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
      console.error('No element found');
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

    var pixelTop = lineNumber*20;
    var offset = container.outerHeight() / 2;
    $(container).scrollTo({
      top: pixelTop - offset,
      left: 0
    }, 300);

    if(lineNumber < 1)
      return;
    var numbers = container.find('.hljs-line-numbers').html();
    container.find('.hljs-line-numbers').html(numbers.replace(lineNumber, '<span class="selectedLine">'+lineNumber+'</span>'));
  }

  static getOpponent(input) {
    if (input == 'src') {
      return 'dst';
    } else if (input == 'dst') {
      return 'src';
    }
  }

  static showError(message) {
    $.notify({
      // options
      message: message
    }, {
      // settings
      delay: 0,
      type: 'danger',
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      }
    });
    console.error(message);
  }

  static showMessage(message) {
    $.notify({
      // options
      message: message
    }, {
      // settings
      type: 'info',
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      }
    });
  }

  static showSuccess(message) {
    $.notify({
      // options
      message: message
    }, {
      // settings
      type: 'success',
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      }
    });
  }

}
export default Utility;
