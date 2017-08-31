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

        var $validator = $('#githubForm').validate({
            // errorClass: 'has-error',
            rules: {
                emailfield: {
                    required: true,
                    email: true,
                    minlength: 3
                },
                namefield: {
                    required: true,
                    minlength: 3
                },
                projecturl: {
                    required: true,
                    remote: {
                        url: 'validate-githuburl',
                        type: 'post'
                    }
                }
            },
            highlight: function(element) {
                $(element).parent().addClass('has-error');
            },
            unhighlight: function(element) {
                $(element).parent().removeClass('has-error');
            },
            onkeyup: function(element) {
                return false;
                // if (element.name == '#emailid') {
                //     return false;
                // }
            }
        });


        $.validator.setDefaults({

        });

        me.options.wizardElement.bootstrapWizard({
            'tabClass': 'nav nav-pills',
            'onNext': function(tab, navigation, index) {
                var $valid = $('#githubForm').valid();
                console.log($valid);
                if (!$valid) {
                    $validator.focusInvalid();
                    return false;
                }
            },
            'onTabClick': function() {
                return false;
            }
        });
        //
        // $('input#address').elementValidAndInvalid(function(element) {
        //     console.log(['validations just ran for this element and it was valid!', element]);
        // }, function(element){
        //     console.log(['validations just ran for this element and it was INVALID!', element]);
        // });
        me.options.wizardElement.bootstrapWizard();
    }

    setDefaults(options, defaults) {
        return _.defaults({}, _.clone(options), defaults);
    }


}
export default GitHubWizard;
