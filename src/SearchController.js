/* global $ */
// import Utility from './Utility';
import _ from 'lodash';

class SearchController{

  constructor(options) {
    this.containerList = [];
    this.searchPanelList = [];
    this.focussedIndex = -1;

    var defaults = {
        focusChangeEvent: 'click',
        searchBarTop: '100px',
        searchBarWidth: '30%',
        animationDuration: 400,
        enableGlobalSearch: false,
        globalScope: 'body'
    };
    this.options = this.setDefaults(options, defaults);

    this.hijackCrtlF();
  }

  setDefaults(options, defaults){
    return _.defaults({}, _.clone(options), defaults);
  }

  hijackCrtlF() {
    var me = this;
    $(window).keydown(function(e){
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {

            if(me.focussedIndex >= 0)
            {
              //hide all other searchpanels
              for (var i = 0; i < me.searchPanelList.length; i++) {
                if(i !== me.focussedIndex)
                me.searchPanelList[i].hide(me.options.animationDuration);
              }
              //prevent browser search
              e.preventDefault();
              //show and focus searchpanel to last focussed container
              var searchPanel = me.searchPanelList[me.focussedIndex];
              searchPanel.toggle(me.options.animationDuration);
              searchPanel.find('#sb-input-'+me.focussedIndex).focus();
            }
        }
    });
  }

  addContainer($container) {
    var me = this;
    me.containerList.push($container);
    this.generateSearchBar($container);

    $container.on(me.options.focusChangeEvent, function() {
      me.focussedIndex = me.containerList.indexOf($container);
    });

  }

  generateSearchBar($elem)
  {
  //var $elem = this.containerList[index];
    // var me = this;
    var index = this.containerList.indexOf($elem);
    var $searchbar = $('<div class="input-group searchbar">'+
                '<div class="input-group-btn search-panel">'+
                    '<input id="globalToggle" data-on="GLOBAL" data-off="LOCAL" type="checkbox" data-toggle="toggle" data-onstyle="info" data-height="43" data-width="80" data-style="globalToggle" />'+
                      // '<span id="search_concept">Regex</span>'+
                // '  </button>'+
                '</div>' +
                // ' <input type="hidden" name="search_param" value="all" id="search_param"> ' +
                ` <input type="text" class="form-control" id="sb-input-${index}" placeholder=""> <span class="overInput"></span>`+
                ' <span class="input-group-btn">' +
                  // `  <button class="btn btn-default" id="sb-submit-${index}" type="button"><span class="glyphicon glyphicon-search"></span></button> ` +
                  ' <button class="btn btn-sm btn-default" data-search="clear" type="button"><span class="glyphicon glyphicon-remove"></span></button> ' +
                  ' <button class="btn btn-sm btn-primary" data-search="next" type="button"><span class="glyphicon glyphicon-chevron-down"></span></button> ' +
                  ' <button class="btn btn-sm btn-primary" data-search="prev" type="button"><span class="glyphicon glyphicon-chevron-up"></span></button> ' +
                '</span></div>');
    //position: fixed; width: 20%; top: 100px; z-index: 5000
    $searchbar.css({
      position: 'fixed',
      width: this.options.searchBarWidth,
      top: this.options.searchBarTop,
      'z-index': 500
    });
    $searchbar.hide();
    var $input = $searchbar.find(`#sb-input-${index}`);

    //$input.on(enter)
    this.searchPanelList[index] = $searchbar;

    $elem.append($searchbar);
    $searchbar.find('#globalToggle').bootstrapToggle();
    $searchbar.find('#globalToggle').on('change', function () {
      console.log('globalToggle clicked');
    });

      // the input field
    var $clearBtn = $searchbar.find('button[data-search=\'clear\']'),
      // prev button
      $prevBtn = $searchbar.find('button[data-search=\'prev\']'),
      // next button
      $nextBtn = $searchbar.find('button[data-search=\'next\']'),
      // the context where to search
      $content = $elem,
      // jQuery object to save <mark> elements
      $results,
      // the class that will be appended to the current
      // focused element
      currentClass = 'current',
      // top offset for the jump (the search bar)
      //offsetTop = 100,
      // the current index of the focused element
      currentIndex = 0;

  /**
   * Jumps to the element matching the currentIndex
   */
  function jumpTo() {
    if ($results.length) {
      var $current = $results.eq(currentIndex);
      $results.removeClass(currentClass);
      if ($current.length) {
        $current.addClass(currentClass);
        //position = $current.offset().top - offsetTop;
        var localOffset = $content.offset().top;
        //Utility.scrollToElementRelativeTo($current, $content);
        $searchbar.find('.overInput').text(parseInt(currentIndex + 1 )+ ' of ' + $results.length);
        $($content).scrollTo($current, 100, {
          offset: 0 - localOffset - 100
        });
      }
    }
  }

    /**
     * Searches for the entered keyword in the
     * specified context on input
     */
    $input.on('input', function() {
      var searchVal = this.value;
      $content.unmark({
        done: function() {
          $content.mark(searchVal, {
            separateWordSearch: true,
            exclude: ['.searchbar *'],
            // noMatch: function(){
            //     $searchbar.find('.overInput').text('No match');
            //     $searchbar.find('.overInput').addClass('danger');
            // },
            done: function(counter) {
              if(counter > 0)
              {
                $searchbar.find('.overInput').removeClass('danger');
                $results = $content.find('mark');
                currentIndex = 0;
                jumpTo();
              } else {
                $searchbar.find('.overInput').text('0 of 0');
                $searchbar.find('.overInput').addClass('danger');
              }

            }
          });
        }
      });
    });

    $input.on('keydown', function( event ) {
    if ( event.which === 13 ) {
        // Do something
        $nextBtn.click();
        // Disable sending the related form
        event.preventDefault();
        return false;
    }
});

    /**
     * Clears the search
     */
    $clearBtn.on('click', function() {
      $content.unmark();
      $searchbar.find('.overInput').text('0 of 0');
      $input.val('').focus();
    });

    /**
     * Next and previous search jump to
     */
    $nextBtn.add($prevBtn).on('click', function() {
      if ($results.length) {
        currentIndex += $(this).is($prevBtn) ? -1 : 1;
        if (currentIndex < 0) {
          currentIndex = $results.length - 1;
        }
        if (currentIndex > $results.length - 1) {
          currentIndex = 0;
        }
        jumpTo();
      }
    });
  }

} export default SearchController;
