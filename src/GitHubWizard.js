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
import hash from 'object-hash';
import Utility from './Utility';
import NProgress from 'NProgress';

class GitHubWizard {

    constructor(options) {
        var me = this;

        this.currentStep = 0;
        this.selectedCommitSha = undefined;
        this.selectedRepoString = undefined;
        this.selectedParentSha = undefined;
        this.currentCommitsPage = 1;

        this.selected = {};
        this.githubAPI = axios.create({
            baseURL: 'https://api.github.com'
        });

        var defaults = {
            wizardElement: $('#githubwizard'),
            finish: function () {

            }
        };
        this.options = this.setDefaults(options, defaults);

        NProgress.configure({ parent: '#' + this.options.wizardElement.attr('id') });

        $('#projecturl-next').on('click', function() {
            var input = $('#projecturl').val();

            me.validateRepo(input, function(){
                NProgress.start();
                me.loadCommits(me.selectedRepoString, me.currentCommitsPage);
            });
        });

        //changes selectedCommitSha to clicked item and highlights it
        $('#commit-list').on('click', '.commit-item', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $this.data('sha');
        });


        $('#commits-next-page').click(function() {
            me.currentCommitsPage++;
            me.loadCommits(me.selectedRepoString, me.currentCommitsPage, function (success) {
                //response was empty or error happened
                if(!success) {
                    me.currentCommitsPage--;
                    $(this).parent().addClass('disabled');
                    Utility.showWarning('Reached end of commit pages.');
                }
                else {
                    if(me.currentCommitsPage > 1)
                    {
                        $('#commits-prev-page').parent().removeClass('disabled');
                    }
                }

            });
        });

        $('#commits-prev-page').click(function() {

            me.currentCommitsPage--;
            if(me.currentCommitsPage < 2) {
                $(this).parent().addClass('disabled');
            }
            me.loadCommits(me.selectedRepoString, me.currentCommitsPage);
        });

        $('#commit-next').on('click', function() {
            if(me.selectedCommitSha) {
                me.loadCommit(me.selectedRepoString, me.selectedCommitSha);
            } else {
                Utility.showMessage('Please select a commit.');
            }
        });

        $('#parent-list').on('click', '.parent-item', function() {
            var $this = $(this);

            $('.parent-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedParentSha = $this.data('sha');
        });

        $('#parent-next').on('click', function() {
            me.options.wizardElement.bootstrapWizard('show', 3);
        });

        //changes selectedCommitSha to clicked item and highlights it
        $('#files-list').on('click', '.file-item', function() {
            var $this = $(this);

            $('.file-item.active').removeClass('active');
            $this.addClass('active');
            me.selectedFileName = $this.data('name');
        });

        $('#files-next').on('click', function() {
            $('#wizard').modal('hide');
            me.diffObject =
            {
                'Id': hash(me.selectedCommitSha + me.selectedParentSha + me.selectedFileName),
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

    loadCommits(repo, page, callback)
    {
        if(!callback) callback = function () { };
        var me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits?page=${page}`
            }
        }).then(function(response) {
            if(response.data.length == 0) {
                callback(false);
                NProgress.done();
                return;
            }
            me.options.wizardElement.bootstrapWizard('show', 1);
            $('#commit-list').html('');
            response.data.forEach(commit => {
                $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                    `<b class="list-group-item-heading">${commit.commit.message}</b><br/>` +
                    `<small class="list-group-item-text">${commit.commit.author.name} ${commit.commit.author.email} ${commit.commit.author.date}</small>` +
                    '</a>');

            });
            NProgress.done();
            callback(true);
            $('#currentCommitsPage').text(me.currentCommitsPage);
        });
    }

    validateRepo(repo, success)
    {
        var me = this;
        var formgroup = $('#projecturl').parent().parent();
        var errorspan = $('#projecturl-error');

        axios.post('/validate-githuburl', {
            projecturl: repo
        }).then(function(response) {
            formgroup.addClass('has-success');
            me.selectedRepoString = response.data.full_name;
            me.currentCommitsPage = 1;

            errorspan.text(me.selectedRepoString + ' exists and will be loaded');
            me.options.wizardElement.bootstrapWizard('show', 1);

            NProgress.done();
            success();

        }).catch(function(error) {
            console.log(error.response);
            NProgress.done();
            errorspan.text(error.response.data.message);
            formgroup.removeClass('has-success');
            formgroup.addClass('has-error');
        });
    }

    loadCommit(repo, commit)
    {
        var me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits/${commit}`
            }
        }).then(function(response) {
            if(response.data.parents.length == 0)
            {
                Utility.showWarning('Selected Commit has 0 Parents and therefore cannot be used as the base commit.');
                NProgress.done();
                return;
            }
            me.selected.commit = response.data;
            if(response.data.parents.length > 1)
            {
                me.options.wizardElement.bootstrapWizard('show', 2);
            }
            else {
                me.selectedParentSha = response.data.parents[0].sha;
                me.options.wizardElement.bootstrapWizard('show', 3);
            }

            $('#files-list').html('');
            response.data.files.forEach(file => {
                $('#files-list').append(`<a href="#" class="list-group-item file-item" data-name="${file.filename}" data-sha="${file.sha}">` +
                    `<b class="list-group-item-heading">${file.filename}</b> <span class="label label-success">+${file.additions}</span> <span class="label label-danger">-${file.deletions}</span><br/>` +
                    // `<pre class="hidden">${file.patch}</pre>` +
                    '</a>');

            });

            $('#parent-list').html('<h4>Select the parent commit to be used for the diff:</h4>');
            response.data.parents.forEach(parent => {
                $('#parent-list').append(`<span class="list-group-item parent-item" data-sha="${parent.sha}">` +
                    `<b class="list-group-item-heading">${parent.sha}</b><br/>` +
                    `<small class="list-group-item-text"><a href="${parent.html_url}" target="_blank">GitHub Commit</a></small>` +
                    '</span>');

            });
            NProgress.done();


        }).catch(function(error) {
            console.error(error);
            Utility.showError(error);
            NProgress.done();
        });
    }

}
export default GitHubWizard;
