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

        $('#projecturl-next').on('click', function() {
            var input = $('#projecturl').val();
            var formgroup = $('#projecturl').parent().parent();
            var errorspan = $('#projecturl-error');

            axios.post('/validate-githuburl', {
                projecturl: input
            }).then(function(response) {
                console.log(response);
                formgroup.addClass('has-success');
                errorspan.text(response.data.full_name + ' exists and will be loaded');
                me.options.wizardElement.bootstrapWizard('show', 1);
                $('#commit-list').html('');
                response.data.forEach(commit => {
                    console.log(commit);
                    $('#commit-list').append('<a href="#" class="list-group-item">'+
                      `<b class="list-group-item-heading commit-item" id="sha${commit.sha}">${commit.commit.message}</b><br/>`+
                      `<small class="list-group-item-text">${commit.commit.author.name} ${commit.commit.author.email} ${commit.commit.author.date}</small>`+
                    '</a>');

                });

            }).catch(function (error) {
                console.log(error.response);
                errorspan.text(error.response.data.message);
                formgroup.removeClass('has-success');
                formgroup.addClass('has-error');
            });
        });


        me.options.wizardElement.bootstrapWizard({
            'tabClass': 'nav nav-pills',
            // 'onNext': function (tab, navigation, index) {
            //     console.log(index);
            //     var isValid = $('#githubForm').valid();
            //     if (!isValid) {
            //         $validator.focusInvalid();
            //         return false;
            //     }
            // },
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
