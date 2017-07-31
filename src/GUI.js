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
import {
  client
} from '../config/default.json';

class GUI {

  constructor() {
    $('#metaDataPanel').hide();
    this.enableEasterEgg();
    this.setupToggleSidebar();

    this.matcherSelector = $('#matcherID');
    $('#baseurl').text('(' + client.apibase + ')');
  }

  setupToggleSidebar() {
    $('#toggleSidebar').click(function() {
      //TODO (christoph) animate this, add more state visuals to #toggleSidebar content
      $('#accordion').toggle();
      $('#codeView').toggleClass('col-sm-9');
      $('#codeView').toggleClass('col-sm-12');
      DiffDrawer.refreshMinimap();
    });
  }

  setVersion(version) {
    $('.versionNumber').text('v' + version);
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

  setHoverEffect(container, selector) {
    $(container)
      .on('mouseover', selector, function(e) {
        // console.log( 'mouse over ' + $(this).attr('id'));
        $(this).focus();
        $(this).css('border', 'black 1px dashed');
        $(this).addClass('hovered');
        $(this).find('.scriptmarker').addClass('subnode');
        e.stopPropagation();
      }).on('mouseout', selector, function(e) {
        // console.log( 'mouse out ' + $(this).attr('id'));
        $(this).css('border', '');
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

}
export default GUI;
