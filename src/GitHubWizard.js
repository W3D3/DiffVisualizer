/* global $ */
/**
 * @file GitHubWizard to browse Github and add diffs from there
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

/**
 * GitHubWizard
 *
 */
import _ from 'lodash';
import axios from 'axios';

class GitHubWizard {

    constructor(options) {
        var me = this;

        this.currentStep = 0;
        this.githubAPI = axios.create({
            baseURL: 'https://api.github.com'
        });

        var defaults = {
            wizardElement: $('#githubwizard')
        };
        this.options = this.setDefaults(options, defaults);

        // Smart Wizard
        this.options.wizardElement.smartWizard({
            selected: 0,  // Initial selected step, 0 = first step
            keyNavigation:true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
            autoAdjustHeight:true, // Automatically adjust content height
            cycleSteps: false, // Allows to cycle the navigation of steps
            backButtonSupport: false, // Enable the back button support
            useURLhash: false, // Enable selection of the step based on url hash
            lang: {  // Language variables
                next: 'Next',
                previous: 'Previous'
            },
            toolbarSettings: {
                toolbarPosition: 'bottom', // none, top, bottom, both
                toolbarButtonPosition: 'right', // left, right
                showNextButton: false, // show/hide a Next button
                showPreviousButton: false, // show/hide a Previous button
                toolbarExtraButtons: [
                    // $('<button></button>').text('Finish')
                    // .addClass('btn btn-info')
                    // .on('click', function(){
                    //     alert('Finsih button click');
                    // }),
                    $('<button></button>').text('Next')
                    .addClass('btn btn-primary')
                    .on('click', function(){
                        alert('next button click');
                    }),
                    $('<button></button>').text('Cancel')
                    .addClass('btn btn-danger')
                    .on('click', function(){
                        alert('Cancel button click');
                    })
                ]
            },
            anchorSettings: {
                anchorClickable: true, // Enable/Disable anchor navigation
                enableAllAnchors: false, // Activates all anchors clickable all times
                markDoneStep: true, // add done css
                enableAnchorOnDoneStep: true // Enable/Disable the done steps navigation
            },
            contentURL: null, // content url, Enables Ajax content loading. can set as data data-content-url on anchor
            disabledSteps: [],    // Array Steps disabled
            errorSteps: [],    // Highlight step with errors
            theme: 'arrows',
            transitionEffect: 'fade', // Effect on navigation, none/slide/fade
            transitionSpeed: '400'
        });

        // Initialize the leaveStep event
        this.options.wizardElement.on('leaveStep', function(e, anchorObject, stepNumber, stepDirection) {
            console.log(stepDirection);
            //return confirm('Do you want to leave the step '+stepNumber+'?');
            if(stepNumber == 0 && stepDirection == 'forward')
            {
                var p1 = me.githubAPI.get('repos/W3D3/difftest/commits').then(function (response) {
                    $('#step-2').text(response);
                });

                // const json = await p1();
                // var outcome = json.then(function (res) {
                //     return res;
                // });
            }
            return true;
        });

        // Initialize the showStep event
        this.options.wizardElement.on('showStep', function(e, anchorObject, stepNumber, stepDirection) {
            console.log(stepDirection);
            alert('You are on step '+stepNumber+' now');
        });
    }

    setDefaults(options, defaults) {
        return _.defaults({}, _.clone(options), defaults);
    }


}
export default GitHubWizard;
