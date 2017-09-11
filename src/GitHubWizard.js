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
import Utility from './Utility';

class GitHubWizard {

    constructor(options) {
        var me = this;

        this.currentStep = 0;
        this.selectedCommitSha = '';
        this.selectedRepoString = '';
        this.selectedParentSha = '';
        this.githubAPI = axios.create({
            baseURL: 'https://api.github.com'
        });

        var defaults = {
            wizardElement: $('#githubwizard'),
            finish: function () {

            }
        };
        this.options = this.setDefaults(options, defaults);

        $('#projecturl-next').on('click', function() {
            var input = $('#projecturl').val();
            var formgroup = $('#projecturl').parent().parent();
            var errorspan = $('#projecturl-error');

            axios.post('/validate-githuburl', {
                projecturl: input
            }).then(function(response) {
                formgroup.addClass('has-success');
                me.selectedRepoString = response.data[0].fullname;
                errorspan.text(me.selectedRepoString + ' exists and will be loaded');
                me.options.wizardElement.bootstrapWizard('show', 1);
                $('#commit-list').html('');
                response.data.forEach(commit => {
                    $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                        `<b class="list-group-item-heading">${commit.commit.message}</b><br/>` +
                        `<small class="list-group-item-text">${commit.commit.author.name} ${commit.commit.author.email} ${commit.commit.author.date}</small>` +
                        '</a>');

                });

            }).catch(function(error) {
                console.log(error.response);
                errorspan.text(error.response.data.message);
                formgroup.removeClass('has-success');
                formgroup.addClass('has-error');
            });
        });

        //changes selectedCommitSha to clicked item and highlights it
        $('#commit-list').on('click', '.commit-item', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $this.data('sha');
        });

        $('#commit-next').on('click', function() {
            axios.get('/githubapi', {
                params: {
                    url: `repos/${me.selectedRepoString}/commits/${me.selectedCommitSha}`
                }
            }).then(function(response) {
                if(response.data.parents.length == 0)
                {
                    Utility.showWarning('Selected Commit has 0 Parents and therefore cannot be used as the base commit.');
                    return;
                }
                if(response.data.parents.length > 1)
                {
                    me.options.wizardElement.bootstrapWizard('show', 2);
                    $('#parent-list').html('');
                    response.data.parents.forEach(parent => {
                        $('#parent-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${parent.sha}">` +
                            `<b class="list-group-item-heading">${parent.sha}</b><br/>` +
                            `<small class="list-group-item-text"><a href="${parent.html_url}" target="_blank">GitHub Commit</a></small>` +
                            '</a>');

                    });
                }
                else {
                    me.selectedParentSha = response.data.parents[0].sha;
                    me.options.wizardElement.bootstrapWizard('show', 3);
                    $('#files-list').html('');
                    response.data.files.forEach(file => {
                        $('#files-list').append(`<a href="#" class="list-group-item file-item" data-name="${file.filename}" data-sha="${file.sha}">` +
                            `<b class="list-group-item-heading">${file.filename}</b> <span class="label label-success">+${file.additions}</span> <span class="label label-danger">-${file.deletions}</span><br/>` +
                            // `<pre class="hidden">${file.patch}</pre>` +
                            '</a>');

                    });
                }


            }).catch(function(error) {
                console.error(error);
            });
        });

        //changes selectedCommitSha to clicked item and highlights it
        $('#files-list').on('click', '.file-item', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedFileName = $this.data('name');
        });

        $('#files-next').on('click', function() {
            $('#wizard').modal('hide');
            me.diffObject =
            {
                'Id': 123,
                'BaseUrl': 'https://github.com/'+me.selectedRepoString,
                'ParentCommit': me.selectedParentSha,
                'Commit': me.selectedCommitSha,
                'SrcFileName': me.selectedFileName,
                'DstFileName': me.selectedFileName,
            };
            me.options.finish(me.diffObject);
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
