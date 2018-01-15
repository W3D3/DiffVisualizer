/* global $ require */
/**
 * @file GitHubWizard to browse Github and add diffs from there
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

/**
 * GitHubWizard
 */
import NProgress from 'nprogress';
import _ from 'lodash';
import axios from 'axios';
import hash from 'object-hash';
import Utility from './Utility';

const parse = require('parse-link-header');

class GitHubWizard {
    constructor(options) {
        const me = this;

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
            baseURL: 'https://api.github.com',
        });

        const defaults = {
            wizardElement: $('#githubwizard'),
            allowedFileExt: '',
            finish() {

            },
        };
        this.setDefaults(options, defaults);

        $('.abort').on('click', () => {
            me.resetWizard();
        });

        NProgress.configure({parent: `#${this.options.wizardElement.attr('id')}`});

        $('#projecturl-next').on('click', () => {
            const input = $('#projecturl').val();
            // clean next page before potential visit
            $('#commit-list').html('');
            $('#paginationdiv').html('');

            me.validateRepo(input, () => {
                NProgress.start();
                me.loadCommits(me.selectedRepoString, me.currentCommitsPage);
            });
        });

        // changes selectedCommitSha to clicked item and highlights it
        $('#commit-list').on('click', '.commit-item', function() {
            const $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $this.data('sha');
            me.html.commit = $this.html();
        });

        $('#loadCommitSha').on('click', function() {
            const $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $('#commitShaInput').val();

            GitHubWizard.generateCommitHTML(me.selectedRepoString, me.selectedCommitSha, (genhtml) => {
                me.html.commit = genhtml;
                $('#commitpreview').html(genhtml);
                $('#commitpreview').data('sha', me.selectedCommitSha);
                $('.commit-item.active').removeClass('active');
                $('#commitpreview').toggleClass('active');
            });
        });

        $('#commitpreview').on('click', function() {
            const $this = $(this);

            $('.commit-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedCommitSha = $this.data('sha');
            me.html.commit = $this.html();
        });

        //

        $('#paginationdiv').on('click', 'a[data-page]', function() {
            me.currentCommitsPage = $(this).data('page');

            me.loadCommits(me.selectedRepoString, me.currentCommitsPage, (success) => {
                if (success) {
                    $('#commit-list').scrollTo(0);
                }
            });
        });

        $('#commit-next').on('click', () => {
            if (me.selectedCommitSha) {
                NProgress.start();
                $('#selected-commit').html(me.html.commit);
                me.loadCommit(me.selectedRepoString, me.selectedCommitSha);
            } else {
                Utility.showMessage('Please select a commit.');
            }
        });

        $('#parent-list').on('click', '.parent-item', function() {
            const $this = $(this);

            $('.parent-item.active').removeClass('active');
            $this.toggleClass('active');
            me.selectedParentSha = $this.data('sha');
        });

        $('#parent-next').on('click', () => {
            me.options.wizardElement.bootstrapWizard('show', 3);
        });

        // changes selectedCommitSha to clicked item and highlights it
        $('#files-list').on('click', '.file-item', function() {
            const $this = $(this);

            $('.file-item.active').removeClass('active');
            $this.addClass('active');
            me.selectedFileName = $this.data('name');
            me.html.file = `<div class="file-item">${$(this).html()}</div>`;
            // we can restrict files here, depending on which global file type is set
            // currently this is not enabled.
            // if(!me.selectedFileName.endsWith('.java'))
            // {
            //     Utility.showWarning('The selected file doesn\'t seem to be a Java file. Proceed with caution as this application currently only supports Java diffing.');
            // }
            me.oldFileName = $this.data('oldname');
        });

        $('#files-next').on('click', () => {
            // finish();
            me.selected.commit.files.forEach((file) => {
                if (file.filename === me.selectedFileName) {
                    me.html.patch = `<pre class="patch">${_.escape(file.patch)}</pre>`;
                }
            });
            const html = `<h1>${me.selectedRepoString}</h1><h3>Commit</h3>${
                me.html.commit
            }<h3>Files</h3>${
                me.html.file}</br>${
                me.html.patch}`;
            $('#review_content').html(html);
            $('#review_content').css('margin', '5px');
            me.options.wizardElement.bootstrapWizard('show', 4);
        });

        $('#finish').on('click', () => {
            me.finish();
        });

        me.options.wizardElement.bootstrapWizard({
            tabClass: 'nav nav-pills',
            // 'onNext': function (tab, navigation, index) {
            //     console.log(index);
            //     var isValid = $('#githubForm').valid();
            //     if (!isValid) {
            //         $validator.focusInvalid();
            //         return false;
            //     }
            // },
            onTabClick(tab, navigation, currentIndex, clickedIndex) {
                if (clickedIndex < currentIndex) {
                    return true;
                }

                return false;
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
        this.options = _.defaults({}, _.clone(options), defaults);
    }

    updateOptions(options) {
        this.options = this.setDefaults(options, this.options);
    }

    loadCommits(repo, page, callback) {
        if (!callback) {
            callback = function() { };
        }
        const me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits?page=${page}`,
            },
        }).then((response) => {
            if (response.data.length == 0) {
                callback(false);
                NProgress.done();
                return;
            }

            $('#commit-list').html('');
            response.data.forEach((commit) => {
                // console.log(commit);
                // $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">` +
                //     '<img src="' + (commit.author ? `${commit.author.avatar_url}` : `https://www.gravatar.com/avatar/${hash(commit.commit.author.email, {algorithm: 'md5'})}?s=50&d=identicon`) + '" alt="" class="pull-left avatar">' +
                //     `<p><b class="list-group-item-heading">${_.escape(commit.commit.message)}</b><br/>` +
                //     `<small class="list-group-item-text">${commit.commit.author.name} <code>&lt;${commit.commit.author.email}&gt;</code> ${commit.commit.author.date}</small>` +
                //     '</p></a>');

                $('#commit-list').append(`<a href="#" class="list-group-item commit-item" data-sha="${commit.sha}">${
                    GitHubWizard.dataToCommitHTML(commit)
                }</a>`);
            });

            if (response.headers.link) {
                GitHubWizard.createPagination(page, response.headers.link);
            }

            NProgress.done();
            if (me.options.wizardElement.bootstrapWizard('currentIndex') != 1) {
                me.options.wizardElement.bootstrapWizard('show', 1);
            }
            callback(true);
        });
    }

    validateRepo(repo, success) {
        const me = this;
        const formgroup = $('#projecturl').parent().parent();
        const errorspan = $('#projecturl-error');

        axios.post('/validate-githuburl', {
            projecturl: repo,
        }).then((response) => {
            formgroup.addClass('has-success');
            me.selectedRepoString = response.data.full_name;
            me.currentCommitsPage = 1;

            errorspan.text(`${me.selectedRepoString} exists and will be loaded`);
            me.options.wizardElement.bootstrapWizard('show', 1);

            NProgress.done();
            success();
        }).catch((error) => {
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

    loadCommit(repo, commit, append) {
        const me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits/${commit}`,
            },
        }).then((response) => {
            if (response.data.parents.length == 0) {
                Utility.showWarning('Selected Commit has 0 Parents and therefore cannot be used as the base commit.');
                NProgress.done();
                return;
            }
            if (response.data.stats.total == 0) {
                Utility.showWarning('This commit contains no changes. Select another one.');
                NProgress.done();
                return;
            }
            me.selected.commit = response.data;
            me.selectedCommitSha = response.data.sha; // in case we sent an abbrivated version of the sha string, we fix it here to always work with the full once


            if (!append) {
                $('#files-list').html('');
            }

            const filesSorted = _.filter(response.data.files, (o) => {
                return o.filename.endsWith(me.options.allowedFileExt);
            });
            const omitted = response.data.files.length - filesSorted.length;
            if (filesSorted.length == 0) {
                // no java files found, abort
                Utility.showWarning(`No ${_.upperCase(me.options.allowedFileExt)} files were found in this commit. Please select a different one.`);

                NProgress.done();
                return;
            }
            if (omitted > 0) {
                $('#files-list').append(`<br /><p>${omitted} non ${_.upperCase(me.options.allowedFileExt)} file(s) omitted.</p> `);
            }

            filesSorted.forEach((file) => {
                const statuslabel = `<span class="label label-default ${file.status}">${file.status}</span>`;
                const oldname = (file.previous_filename ? file.previous_filename : file.filename);
                const fileshtml = `<a href="#" class="list-group-item file-item" data-name="${file.filename}" data-oldname="${oldname}" data-sha="${file.sha}">${
                    statuslabel
                }<b class="list-group-item-heading">${
                    file.previous_filename ? ` ${file.previous_filename} &#8658; ` : ''
                } ${file.filename}</b>${
                    file.additions > 0 ? ` <span class="label label-success">+${file.additions}</span>` : ''
                }${file.deletions > 0 ? ` <span class="label label-danger">-${file.deletions}</span><br/>` : ''
                // `<pre>${_.escape(file.patch)}</pre>` +
                }</a>`;
                $('#files-list').append(fileshtml);
            });


            $('#parent-list').html('<h4>Select the parent commit to be used for the diff:</h4>');
            response.data.parents.forEach((parent) => {
                $('#parent-list').append(`<span class="list-group-item parent-item" data-sha="${parent.sha}">` +
                    `<b class="list-group-item-heading">${parent.sha}</b><br/>` +
                    `<small class="list-group-item-text"><a href="${parent.html_url}" target="_blank">GitHub Commit</a></small>` +
                    '</span>');
            });

            if (response.data.parents.length > 1) {
                me.options.wizardElement.bootstrapWizard('show', 2);
            } else {
                me.selectedParentSha = response.data.parents[0].sha;
                $('.parent-item').addClass('active');
                me.options.wizardElement.bootstrapWizard('show', 3);
            }

            NProgress.done();
        }).catch((error) => {
            // console.error(error);
            Utility.showError(error);
            NProgress.done();
        });
    }

    finish() {
        const me = this;
        $('#wizard').modal('hide');
        me.diffObject =
        {
            // 'id': hash(me.selectedCommitSha + me.selectedParentSha + me.selectedFileName),
            baseUrl: `https://github.com/${me.selectedRepoString}`,
            parentCommit: me.selectedParentSha,
            commit: me.selectedCommitSha,
            srcFileName: me.oldFileName,
            dstFileName: me.selectedFileName,
        };
        me.options.finish(me.diffObject);
        me.resetWizard();
    }

    static generateCommitHTML(repo, commitsha, callback) {
        // var me = this;
        axios.get('/githubapi', {
            params: {
                url: `repos/${repo}/commits/${commitsha}`,
            },
        }).then((response) => {
            // console.log(response);
            // var commit = response.data.commit;
            const html = GitHubWizard.dataToCommitHTML(response.data);
            callback(html);
        }).catch((error) => {
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
        const commit = data.commit;
        const html = `<img src="${data.author ? `${data.author.avatar_url}` : `https://www.gravatar.com/avatar/${hash(commit.author.email, {algorithm: 'md5'})}?s=50&d=identicon`}" alt="" class="pull-left avatar">` +
        `<p><b class="list-group-item-heading">${_.escape(commit.message)}</b><br/>` +
        `<small class="list-group-item-text">${commit.author.name} <code>&lt;${commit.author.email}&gt;</code>` +
        `<span title="${commit.author.date}">${Utility.timeAgoString(commit.author.date)}</span></small>` +
        '</p>';
        return html;
    }

    static createPagination(currentPage, linkHeader) {
        if (!linkHeader) {
            $('#paginationdiv').html('');
        }
        // paginationdiv
        const parsed = parse(linkHeader);
        const maxCountLeft = 4;
        const maxCountRight = 4;
        // <ul class="pagination">
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
        // </ul>
        let paginationHTML = '<ul class="pagination">';
        if (parsed.prev) {
            paginationHTML += `<li><a href="#" aria-label="Previous" data-page="${parsed.prev.page}"> &laquo; </a>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#" aria-label="Previous"> &laquo; </a>';
        }

        if (parsed.first) {
            paginationHTML += `<li><a href="#" aria-label="First" data-page="${parsed.first.page}"> ${parsed.first.page} </a><li>`;

            let i = currentPage - maxCountLeft;
            if (i < parseInt(parsed.first.page, 10)) {
                i = parseInt(parsed.first.page, 10) + 1;
            } else {
                paginationHTML += '<a href="#"> ... </a>';
            }

            for (;i < currentPage; i++) {
                paginationHTML += `<li><a href="#" data-page="${i}"> ${i} </a>`;
            }
        }

        paginationHTML += `<li class="active"><a href="#"> ${currentPage} </a>`;

        if (parsed.last) {
            let j = currentPage + 1;
            let limit = currentPage + maxCountRight;
            if (limit > parsed.last.page) {
                limit = parseInt(parsed.last.page, 10);
            }

            for (;j < limit; j++) {
                paginationHTML += `<li><a href="#" data-page="${j}"> ${j} </a>`;
            }

            if (!(currentPage + maxCountRight > parsed.last.page)) {
                paginationHTML += '<a href="#"> ... </a>';
            }
            paginationHTML += `<li><a href="#" aria-label="Last" data-page="${parsed.last.page}"> ${parsed.last.page} </a>`;
        }

        if (parsed.next) {
            paginationHTML += `<li><a href="#" aria-label="Next" data-page="${parsed.next.page}"> &raquo; </a>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#" aria-label="Next"> &raquo; </a>';
        }

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

        const formgroup = $('#projecturl').parent().parent();
        const errorspan = $('#projecturl-error');

        formgroup.removeClass('has-success');
        formgroup.removeClass('has-error');

        errorspan.text('');
        this.options.wizardElement.bootstrapWizard('show', 0);
    }
}
export default GitHubWizard;
