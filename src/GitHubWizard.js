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
        this.selectedFileName = undefined;
        this.oldFileName = undefined;
        this.currentCommitsPage = 1;

        this.selected = {};
        this.html = {};
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
            me.html.commit =  $this.html();
        });

        $('#loadCommitSha').on('click', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $('#commitShaInput').val();
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
                NProgress.start();
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
            if(!me.selectedFileName.endsWith('.java'))
            {
                Utility.showWarning('The selected file doesn\'t seem to be a Java file. Proceed with caution as this application currently only supports Java diffing.');
            }
            me.oldFileName = $this.data('oldname');
        });

        $('#files-next').on('click', function() {
            // finish();
            var html = `<h1>${me.selectedRepoString}</h1>`+
                        me.html.commit;
            $('#review_content').html(html);
            me.options.wizardElement.bootstrapWizard('show', 4);
        });

        $('#finish').on('click', function() {
            me.finish();
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
                console.log(commit);
                $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                    '<img src="' + (commit.author ? `${commit.author.avatar_url}` : `https://www.gravatar.com/avatar/${hash(commit.commit.author.email, {algorithm: 'md5'})}?s=50&d=identicon`) + '" alt="" class="pull-left avatar">' +
                    `<p><b class="list-group-item-heading">${_.escape(commit.commit.message)}</b><br/>` +
                    `<small class="list-group-item-text">${commit.commit.author.name} <code>&lt;${commit.commit.author.email}&gt;</code> ${commit.commit.author.date}</small>` +
                    '</p></a>');

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
            // console.log(error.response);
            NProgress.done();
            errorspan.text(error.response.data.message);
            formgroup.removeClass('has-success');
            formgroup.addClass('has-error');
        });
    }

    loadCommit(repo, commit, append)
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
            me.selectedCommitSha = response.data.sha; // in case we sent an abbrivated version of the sha string, we fix it here to always work with the full once
            if(response.data.parents.length > 1)
            {
                me.options.wizardElement.bootstrapWizard('show', 2);
            }
            else {
                me.selectedParentSha = response.data.parents[0].sha;
                me.options.wizardElement.bootstrapWizard('show', 3);
            }
            if(!append) $('#files-list').html('');
            response.data.files.forEach(file => {
                var statuslabel = `<span class="label label-default ${file.status}">${file.status}</span>`;
                var oldname = (file.previous_filename  ? file.previous_filename : file.filename);
                var fileshtml = `<a href="#" class="list-group-item file-item" data-name="${file.filename}" data-oldname="${oldname}" data-sha="${file.sha}">` +
                statuslabel +
                '<b class="list-group-item-heading">' +
                (file.previous_filename  ? ` ${file.previous_filename} >> ` : '') +
                ` ${file.filename}</b>` +
                (file.additions > 0 ? ` <span class="label label-success">+${file.additions}</span>` : '') +
                (file.deletions > 0 ? ` <span class="label label-danger">-${file.deletions}</span><br/>` : '') +
                // `<pre>${_.escape(file.patch)}</pre>` +
                '</a>';
                $('#files-list').append(fileshtml);

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
            // console.error(error);
            Utility.showError(error);
            NProgress.done();
        });
    }

    finish()
    {
        var me = this;
        $('#wizard').modal('hide');
        me.diffObject =
        {
            'Id': hash(me.selectedCommitSha + me.selectedParentSha + me.selectedFileName),
            'BaseUrl': 'https://github.com/'+me.selectedRepoString,
            'ParentCommit': me.selectedParentSha,
            'Commit': me.selectedCommitSha,
            'SrcFileName': me.oldFileName,
            'DstFileName': me.selectedFileName,
        };
        me.options.finish(me.diffObject);
    }

}
export default GitHubWizard;
