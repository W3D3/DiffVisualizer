/* global $ */
/**
 * @file Search Controller to add and configure Searchbars to containers
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

/**
 * SearchController
 * can search inside single / all added containers
 */
import _ from 'lodash';

class SearchController {
    constructor(options) {
        this.containerList = [];
        this.searchPanelList = [];
        this.visibilityState = [];
        this.focussedIndex = -1;
        this.lastSearched = '';
        this.enabled = true;

        const defaults = {
            // on which event the focussed element should change
            focusChangeEvent: 'click',
            // top css property of the searchbar
            searchBarTop: '100px',
            // width css property of the searchbar
            searchBarWidth: '30%',
            // animation duration for hide/show in ms
            animationDuration: 400,
            // switch for enabling search over all the added searchbars on toggle via GUI
            enableGlobalSearch: true,
        };
        this.options = this.setDefaults(options, defaults);

        this.hijackCrtlF();
    }

    setDefaults(options, defaults) {
        return _.defaults({}, _.clone(options), defaults);
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }

    hideAll() {
        for (let i = 0; i < this.searchPanelList.length; i++) {
            this.hideSearchbar(i);
        }
    }

    hideSearchbar(id) {
        const searchPanel = this.searchPanelList[id];
        const container = this.containerList[id];
        const input = searchPanel.find(`#sb-input-${id}`);

        this.visibilityState[id] = false;
        input.val('');
        input.trigger('input');
        searchPanel.hide(this.options.animationDuration);
        $(container).css({
            'padding-top': '0',
        });
    }

    hijackCrtlF() {
        const me = this;

        $(window).keydown((e) => {
            // consider adding && e.shiftKey ?
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 70 && me.enabled == true) {
                let searchPanel;
                let container;
                let input;
                if (me.focussedIndex >= 0) {
                    // hide all other searchpanels
                    for (let i = 0; i < me.searchPanelList.length; i++) {
                        if (i !== me.focussedIndex) {
                            searchPanel = me.searchPanelList[i];
                            container = me.containerList[i];
                            input = searchPanel.find(`#sb-input-${i}`);

                            me.visibilityState[i] = false;
                            input.val('');
                            input.trigger('input');
                            searchPanel.hide(me.options.animationDuration);
                            $(container).css({
                                'padding-top': '0',
                            });
                        }
                    }
                    // prevent browser search
                    e.preventDefault();
                    // show and focus searchpanel to last focussed container
                    searchPanel = me.searchPanelList[me.focussedIndex];
                    container = me.containerList[me.focussedIndex];
                    input = searchPanel.find(`#sb-input-${me.focussedIndex}`);

                    me.visibilityState[me.focussedIndex] = !me.visibilityState[me.focussedIndex];
                    if (me.visibilityState[me.focussedIndex]) { // if is visible
                        input.val(me.lastSearched);
                        searchPanel.show(me.options.animationDuration);
                        input.focus();
                        input.trigger('input');
                        $(container).css({
                            'padding-top': input.outerHeight(),
                        });
                    } else {
                        $(container).css({
                            'padding-top': '0',
                        });
                        me.lastSearched = input.val();
                        input.val('');
                        input.trigger('input');
                        searchPanel.hide(me.options.animationDuration);
                    }
                }
            }
        });
    }

    addContainer($container) {
        const me = this;
        me.containerList.push($container);
        this.generateSearchBar($container);

        $container.on(me.options.focusChangeEvent, () => {
            me.focussedIndex = me.containerList.indexOf($container);
        });
    }

    /**
     * generates and attaches the Searchbar to a Dom elemen
     * @param  {[jQuery Element]} $elem [the element to attach the searchbar to]
     */
    generateSearchBar($elem) {
        const me = this;
        const index = this.containerList.indexOf($elem);
        let searchbarhtml = '<div class="input-group searchbar">';
        if (me.options.enableGlobalSearch) {
            searchbarhtml += '<div class="input-group-btn search-panel">' +
                '<input id="globalToggle" data-on="GLOBAL" data-off="LOCAL" type="checkbox" data-toggle="toggle" data-onstyle="info" data-height="43" data-width="80" data-style="globalToggle" />' +
                '</div>';
        }
        searchbarhtml += ` <input type="text" class="form-control" id="sb-input-${index}" placeholder="">` +
            ' <span class="input-group-btn">' +
            // `  <button class="btn btn-default" id="sb-submit-${index}" type="button"><span class="glyphicon glyphicon-search"></span></button> ` +
            // ' <button class="btn btn-sm btn-default" data-search="clear" type="button"><span class="glyphicon glyphicon-remove"></span></button> ' +
            ' <button class="btn btn-sm bg-default overInput" type="button" disabled="disabled">0 of 0</button> ' +
            ' <button class="btn btn-sm btn-primary" data-search="next" type="button"><span class="glyphicon glyphicon-chevron-down"></span></button> ' +
            ' <button class="btn btn-sm btn-primary" data-search="prev" type="button"><span class="glyphicon glyphicon-chevron-up"></span></button> ' +
            '</span></div>';

        const $searchbar = $(searchbarhtml);

        $searchbar.css({
            position: 'fixed',
            width: this.options.searchBarWidth,
            top: this.options.searchBarTop,
            'z-index': 500,
        });
        $searchbar.hide();
        const $input = $searchbar.find(`#sb-input-${index}`);

        this.searchPanelList[index] = $searchbar;
        this.visibilityState[index] = false;

        $elem.append($searchbar);
        $searchbar.find('#globalToggle').bootstrapToggle();

        let finalResults = [];
        // the input field
        let $clearBtn = $searchbar.find('button[data-search=\'clear\']'),
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
            // the current index of the focused element
            currentIndex = 0;

        $searchbar.find('#globalToggle').on('change', function() {
            if (me.options.enableGlobalSearch) {
                if ($(this).prop('checked')) {
                    $content = $($.map(me.containerList, (el) => {
                        return $.makeArray(el);
                    }));
                    $input.trigger('input');
                    $input.focus();
                } else {
                    $content.unmark({
                        done() {
                            $content = $elem;
                            $input.trigger('input');
                            $input.focus();
                        },
                    });
                }
            }
        });

        /**
         * Jumps to the element matching the currentIndex.
         */
        function jumpTo() {
            if (finalResults.length) {
                const currentElements = finalResults[currentIndex];

                $results.removeClass(currentClass);
                currentElements.forEach((subelem) => {
                    $(subelem).addClass(currentClass);
                });
                const firsElem = currentElements[0];
                const localOffset = $content.offset().top;
                $searchbar.find('.overInput').text(`${parseInt(currentIndex + 1, 10)} of ${finalResults.length}`);
                if ($searchbar.find('#globalToggle').prop('checked')) {
                    for (let i = 0; i < me.containerList.length; i++) {
                        if (me.containerList[i].has(`.${currentClass}`).length > 0) {
                            $(me.containerList[i]).scrollTo(firsElem, 50, {
                                offset: 0 - localOffset - 100,
                            });
                            i = me.containerList.length;
                        }
                    }
                } else {
                    $($content).scrollTo(firsElem, 50, {
                        offset: 0 - localOffset - 100,
                    });
                }
            }
        }

        /**
         * Searches for the entered keyword in the
         * specified context on input
         */
        $input.on('input', _.debounce(function() {
            const searchVal = this.value;
            const searchValLength = searchVal.length;
            let charCounter = 0;
            let i = 0;
            finalResults = [];
            me.lastSearched = searchVal;

            // disable search when length is 3 or less characters
            if (searchVal.length > 0 && searchVal.length < 4) {
                $searchbar.find('.overInput').addClass('danger');
                $searchbar.find('.overInput').text('input too short');
                return;
            }
            $content.unmark({
                done() {
                    $content.mark(searchVal, {
                        separateWordSearch: false,
                        ignoreJoiners: true,
                        acrossElements: true,
                        wildcards: 'disabled',
                        exclude: ['.searchbar *'],
                        each(marked) {
                            // group into finalResults
                            if (charCounter == 0) {
                                finalResults[i] = [];
                            }
                            charCounter += $(marked).text().length;
                            if (charCounter === searchValLength) {
                                finalResults[i].push(marked);
                                charCounter = 0;
                                i++;
                            } else {
                                // console.log(charCounter+'/'+searchValLength);
                                finalResults[i].push(marked);
                            }
                        },
                        done(counter) {
                            // console.log(counter);
                            if (counter > 0) {
                                $searchbar.find('.overInput').removeClass('danger');
                                $results = $content.find('mark');
                                currentIndex = 0;
                                i = 0;
                                jumpTo();
                            } else {
                                $searchbar.find('.overInput').text('0 of 0');
                                $searchbar.find('.overInput').addClass('danger');
                            }
                        },
                    });
                },
            });
        }, 300));

        $input.on('keydown', (event) => {
            if (event.which === 13) {
                $nextBtn.click();
                // Disable sending the related form
                event.preventDefault();
                return false;
            }
            return true;
        });

        /**
         * Clears the search
         */
        $clearBtn.on('click', () => {
            $content.unmark();
            $searchbar.find('.overInput').text('0 of 0');
            $input.val('').focus();
        });

        /**
         * Next and previous search jump to
         */
        $nextBtn.add($prevBtn).on('click', function() {
            if (finalResults.length) {
                currentIndex += $(this).is($prevBtn) ? -1 : 1;
                if (currentIndex < 0) {
                    currentIndex = finalResults.length - 1;
                }
                if (currentIndex > finalResults.length - 1) {
                    currentIndex = 0;
                }
                jumpTo();
            }
        });
    }
}
export default SearchController;
