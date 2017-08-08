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
        searchBarWidth: '20%',
        animationDuration: 400
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
      console.log(me.focussedIndex);
    });

  }

  generateSearchBar($elem)
  {
  //var $elem = this.containerList[index];
    var me = this;
    var index = this.containerList.indexOf($elem);
    var $searchbar = $('<div class="input-group">'+
                '<div class="input-group-btn search-panel">'+
                    '<button type="button" class="btn btn-default">'+
                      '<span id="search_concept">Regex</span>'+
                '  </button>'+
                '</div>' +
                ' <input type="hidden" name="search_param" value="all" id="search_param"> ' +
                ` <input type="text" class="form-control" id="sb-input-${index}" placeholder="Search term..."> `+
                ' <span class="input-group-btn"> ' +
                  `  <button class="btn btn-default" id="sb-submit-${index}" type="button"><span class="glyphicon glyphicon-search"></span></button> ` +
                '</span></div>');
    //position: fixed; width: 20%; top: 100px; z-index: 5000
    $searchbar.css({
      position: 'fixed',
      width: this.options.searchBarWidth,
      top: this.options.searchBarTop,
      'z-index': 5000
    });
    $searchbar.hide();
    var $input = $searchbar.find(`#sb-input-${index}`);

    //$input.on(enter)
    this.searchPanelList[index] = $searchbar;

    $elem.append($searchbar);
    $(`#sb-submit-${index}`).on('click', function () {
      console.log('sb sumbit clicked');
      me.executeSearch($elem, $input.val());
    });
  }

  executeSearch($elem, searchstring)
  {
    console.log($elem, searchstring);
  }

} export default SearchController;
