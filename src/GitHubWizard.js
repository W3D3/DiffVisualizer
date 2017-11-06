/* global $ require */
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
import NProgress from 'nprogress';
var parse = require('parse-link-header');

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

        $('.abort').on('click', function() {
            me.resetWizard();
        });

        NProgress.configure({ parent: '#' + this.options.wizardElement.attr('id') });

        $('#projecturl-next').on('click', function() {
            var input = $('#projecturl').val();
            //clean next page before potential visit
            $('#commit-list').html('');
            $('#paginationdiv').html('');

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
            me.html.commit = $this.html();
        });

        $('#loadCommitSha').on('click', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $('#commitShaInput').val();

            me.generateCommitHTML(me.selectedRepoString, me.selectedCommitSha, function (genhtml) {
                me.html.commit = genhtml;
                $('#commitpreview').html(genhtml);
                $('#commitpreview').data('sha', me.selectedCommitSha);
                $('.commit-item.active').removeClass('active');
                $('#commitpreview').toggleClass('active');
                //$('#commit-next').trigger('click');
            });
        });

        $('#commitpreview').on('click', function() {
            var $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $this.data('sha');
            me.html.commit = $this.html();
        });

        //

        $('#paginationdiv').on('click', 'a[data-page]', function() {
            me.currentCommitsPage = $(this).data('page');

            me.loadCommits(me.selectedRepoString, me.currentCommitsPage, function (success) {
                if(success) $('#commit-list').scrollTo(0);
            });
        });

        $('#commit-next').on('click', function() {
            if(me.selectedCommitSha) {
                NProgress.start();
                $('#selected-commit').html(me.html.commit);
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
            me.html.file = '<div class="file-item">'+$(this).html()+'</div>';
            if(!me.selectedFileName.endsWith('.java'))
            {
                Utility.showWarning('The selected file doesn\'t seem to be a Java file. Proceed with caution as this application currently only supports Java diffing.');
            }
            me.oldFileName = $this.data('oldname');
        });

        $('#files-next').on('click', function() {
            // finish();
            me.selected.commit.files.forEach(file => {
                if (file.filename === me.selectedFileName) {
                    me.html.patch = `<pre class="patch">${_.escape(file.patch)}</pre>`;
                }
            });
            var html = `<h1>${me.selectedRepoString}</h1><h3>Commit</h3>`+
                        me.html.commit +
                        '<h3>Files</h3>' +
                        me.html.file + '</br>' +
                        me.html.patch;
            $('#review_content').html(html);
            $('#review_content').css('margin', '5px');
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
            'onTabClick': function(tab, navigation, currentIndex, clickedIndex) {
                if(clickedIndex < currentIndex)
                {
                    return true;
                }
                else {
                    return false;
                }

            },
            // 'onTabChange': function (tab, navigation, currentIndex, clickedIndex) {
            //     console.log('shown!'+ currentIndex);
            //     for (var i = 0; i <= currentIndex; i++) {
            //         me.options.wizardElement.bootstrapWizard('enable', i);
            //     }
            //     for (i = currentIndex + 1; i <= me.options.wizardElement.bootstrapWizard('navigationLength'); i++) {
            //         me.options.wizardElement.bootstrapWizard('disable', i);
            //     }
            // }
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

            $('#commit-list').html('');
            response.data.forEach(commit => {
                // console.log(commit);
                // $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                //     '<img src="' + (commit.author ? `${commit.author.avatar_url}` : `https://www.gravatar.com/avatar/${hash(commit.commit.author.email, {algorithm: 'md5'})}?s=50&d=identicon`) + '" alt="" class="pull-left avatar">' +
                //     `<p><b class="list-group-item-heading">${_.escape(commit.commit.message)}</b><br/>` +
                //     `<small class="list-group-item-text">${commit.commit.author.name} <code>&lt;${commit.commit.author.email}&gt;</code> ${commit.commit.author.date}</small>` +
                //     '</p></a>');

                $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                        GitHubWizard.dataToCommitHTML(commit) +
                        '</a>');

            });

            if(response.headers.link) {
                GitHubWizard.createPagination(page, response.headers.link);
            }

            NProgress.done();
            if(me.options.wizardElement.bootstrapWizard('currentIndex') != 1) me.options.wizardElement.bootstrapWizard('show', 1);
            callback(true);
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
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
                errorspan.text(error.response.data.message);
                formgroup.removeClass('has-success');
                formgroup.addClass('has-error');
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
                Utility.showError('Server response not received.');
            } else {
                // Something happened in setting up the request that triggered an Error
                Utility.showError(error.message);
            }

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
            if(response.data.stats.total == 0) {
                Utility.showWarning('This commit contains no changes. Select another one.');
                NProgress.done();
                return;
            }
            me.selected.commit = response.data;
            me.selectedCommitSha = response.data.sha; // in case we sent an abbrivated version of the sha string, we fix it here to always work with the full once


            if(!append) $('#files-list').html('');

            var filesSorted = _.filter(response.data.files, function(o) { return o.filename.endsWith('.java'); });
            var omitted = response.data.files.length - filesSorted.length;
            if(filesSorted.length == 0) {
                //no java files found, abort
                Utility.showWarning('No java files were found in this commit. Please select a different one.');
                NProgress.done();
                return;
            }
            if(omitted > 0) $('#files-list').append('<br /><p>' + omitted + ' non java file(s) omitted.</p>');


            filesSorted.forEach(file => {
                var statuslabel = `<span class="label label-default ${file.status}">${file.status}</span>`;
                var oldname = (file.previous_filename  ? file.previous_filename : file.filename);
                var fileshtml = `<a href="#" class="list-group-item file-item" data-name="${file.filename}" data-oldname="${oldname}" data-sha="${file.sha}">` +
                statuslabel +
                '<b class="list-group-item-heading">' +
                (file.previous_filename  ? ` ${file.previous_filename} &#8658; ` : '') +
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

            if(response.data.parents.length > 1)
            {
                me.options.wizardElement.bootstrapWizard('show', 2);
            }
            else {
                me.selectedParentSha = response.data.parents[0].sha;
                $('.parent-item').addClass('active');
                me.options.wizardElement.bootstrapWizard('show', 3);
            }

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
            // 'id': hash(me.selectedCommitSha + me.selectedParentSha + me.selectedFileName),
            'baseUrl': 'https://github.com/'+me.selectedRepoString,
            'parentCommit': me.selectedParentSha,
            'commit': me.selectedCommitSha,
            'srcFileName': me.oldFileName,
            'dstFileName': me.selectedFileName,
        };
        me.options.finish(me.diffObject);
        me.resetWizard();
    }

    generateCommitHTML(repo, commitsha, callback)
    {
        // var me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits/${commitsha}`
            }
        }).then(function(response) {
            // console.log(response);
            // var commit = response.data.commit;
            var html = GitHubWizard.dataToCommitHTML(response.data);
            callback(html);
        }).catch(function (error) {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
                Utility.showError('Invalid request - check SHA?');
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
                Utility.showError('Server response not received.');
            } else {
                // Something happened in setting up the request that triggered an Error
                Utility.showError(error.message);
            }
        });
    }

    static dataToCommitHTML(data) {
        var commit = data.commit;
        var html = '<img src="' + (data.author ? `${data.author.avatar_url}` : `https://www.gravatar.com/avatar/${hash(commit.author.email, {algorithm: 'md5'})}?s=50&d=identicon`) + '" alt="" class="pull-left avatar">' +
        `<p><b class="list-group-item-heading">${_.escape(commit.message)}</b><br/>` +
        `<small class="list-group-item-text">${commit.author.name} <code>&lt;${commit.author.email}&gt;</code> <span title="${commit.author.date}">${Utility.timeAgoString(commit.author.date)}</span></small>` +
        '</p>';
        return html;
    }

    static createPagination(currentPage, linkHeader) {
        if(!linkHeader) {
            $('#paginationdiv').html('');
        }
        //paginationdiv
        var parsed = parse(linkHeader);
        var maxCountLeft = 4;
        var maxCountRight = 4;
        //<ul class="pagination">
        //     <li class="disabled">
        //         <a href="#" aria-label="Previous" id="commits-prev-page">
        //   &laquo; previous page
        // </a>
        //     </li>
        //     <li>
        //         <a href="#">
        //   <span id="currentCommitsPage">1</span>
        // </a>
        //     </li>
        //     <li>
        //         <a href="#" aria-label="Next" id="commits-next-page">
        //   next page &raquo;
        // </a>
        //     </li>
        //</ul>
        var paginationHTML = '<ul class="pagination">';
        if(parsed.prev) {
            paginationHTML += `<li><a href="#" aria-label="Previous" data-page="${parsed.prev.page}"> &laquo; </a>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#" aria-label="Previous"> &laquo; </a>';
        }

        if(parsed.first) {
            paginationHTML += `<li><a href="#" aria-label="First" data-page="${parsed.first.page}"> ${parsed.first.page} </a><li>`;

            var i = currentPage - maxCountLeft;
            if(i < parseInt(parsed.first.page)) {
                i = parseInt(parsed.first.page) + 1;
            } else {
                paginationHTML += '<a href="#"> ... </a>';
            }

            for(;i < currentPage; i++)
            {
                paginationHTML += `<li><a href="#" data-page="${i}"> ${i} </a>`;
            }
        }


        paginationHTML += `<li class="active"><a href="#"> ${currentPage} </a>`;

        if(parsed.last) {
            var j = currentPage + 1;
            var limit = currentPage + maxCountRight;
            if(limit > parsed.last.page) limit = parseInt(parsed.last.page);

            for(;j < limit; j++)
            {
                paginationHTML += `<li><a href="#" data-page="${j}"> ${j} </a>`;
            }

            if(!(currentPage + maxCountRight > parsed.last.page)) {
                paginationHTML += '<a href="#"> ... </a>';
            }
            paginationHTML += `<li><a href="#" aria-label="Last" data-page="${parsed.last.page}"> ${parsed.last.page} </a>`;
        }

        if(parsed.next) {
            paginationHTML += `<li><a href="#" aria-label="Next" data-page="${parsed.next.page}"> &raquo; </a>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#" aria-label="Next"> &raquo; </a>';
        }

        console.log(parsed);
        $('#paginationdiv').html(paginationHTML);
    }


    resetWizard() {
        $('#wizard').modal('hide');

        this.currentStep = 0;
        this.selectedCommitSha = undefined;
        this.selectedRepoString = undefined;
        this.selectedParentSha = undefined;
        this.selectedFileName = undefined;
        this.oldFileName = undefined;
        this.currentCommitsPage = 1;

        $('#projecturl').val('');

        var formgroup = $('#projecturl').parent().parent();
        var errorspan = $('#projecturl-error');

        formgroup.removeClass('has-success');
        formgroup.removeClass('has-error');

        errorspan.text('');
        this.options.wizardElement.bootstrapWizard('show', 0);


    }

}
export default GitHubWizard;
