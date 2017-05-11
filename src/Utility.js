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
}
export default Utility;
