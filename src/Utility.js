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
    console.log('main:' + main.offset().top + '-elem:' + elem.offset().top);
    if (elem) {
      var t = main.offset().top;
      main.animate({
        scrollTop: elem.offset().top - t
      }, 500);
    } else {
      console.error('No element found');
    }
  }

  static getProgressBarConfig() {
    let config = {
      onUploadProgress: progressEvent => {
        let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
        // do whatever you like with the percentage complete
        // maybe dispatch an action that will update a progress bar or something
      }
    }
    return config;
  }

  static getOpponent(input) {
    if (input == "src") {
      return "dst";
    } else if (input == "dst") {
      return 'src';
    }
  }


}
export default Utility;
