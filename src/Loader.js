/* global $ */
/**
 * @file Uploading and parsing JSON diff lists
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import Utility from './Utility';
import GUI from './GUI';
import Settings from './Settings';
import Diff from './Diff';
import Dropzone from 'dropzone';
import axios from 'axios';
import NProgress from 'nprogress';
import BootstrapMenu from 'bootstrap-menu';
// import _ from 'lodash';

class Loader {
    constructor() {
        //var me = this;
        Loader.loadedDiffObjects = [];
        //Configure dropzone
        Dropzone.options.jsonUploader = {
            paramName: 'file', // The name that will be used to transfer the file
            dictDefaultMessage: 'Import as JSON file (Drag and Drop)',
            maxFilesize: 2, // MB
            accept: function(file, done) {
                //accept all files for now
                //console.log(file);
                NProgress.configure({
                    parent: '#jsonUploader'
                });
                NProgress.start();
                done();
            },
            acceptedFiles: '.json',
            maxFiles: 1,
            success: Loader.loadDiffsFromFile,
            error: function(file, err, xhr) {
                // console.log(file);
                NProgress.done();
                this.removeAllFiles();

                if (xhr) {
                    Utility.showError('Error parsing file - ' + err.error);
                    return;
                }
                if (!file.accepted) {
                    Utility.showWarning('Invalid filetype. Only .json is allowed.');
                    return;
                }
            },
            init: function() {

                this.on('addedfile', function() {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                });

            }
        };

        //show all the already uploaded elements
        Loader.showUploadedElements();
    }

    static showUploadedElements() {
        //var me = this;
        var alreadyUploaded = Settings.getAllFiles();
        $('#uploadedFiles').html('');
        alreadyUploaded.forEach(filename => {
            $('#uploadedFiles').append(`<a href="#" class="list-group-item fileButton" data-key="${filename}"> ${filename} <i class="fa fa-times pull-right delete-set"></i></a> `);
            //<i class="fa fa-times pull-right" style="color: red"></i></a>
        });

        $('.fileButton').on('click', function() {
            NProgress.configure({
                parent: '#uploadedFiles'
            });
            NProgress.start();
            $(this).parent().find('.fileButton').removeClass('active');
            $(this).addClass('active');
            Loader.createDiffList(Settings.loadFile($(this).data('key')));
            Utility.showSuccess('Finished loading <i>' + $(this).data('key') + '</i>');
        });

        $('.delete-set').on('click', function() {
            var keyToBeDeleted = $(this).parent().data('key');
            Settings.deleteFile(keyToBeDeleted);
            $(this).parent().remove();
            Utility.showSuccess('Deleted <i>' + keyToBeDeleted + '</i> from saved sets.');
            return;
        });
    }

    static loadDiffsFromFile(file, filename) {
        axios.get('/uploads/' + filename)
            .then(response => {
                Settings.saveFile(file.name, response.data);
                Loader.showUploadedElements();
                Loader.createDiffList(response.data);

                Utility.showSuccess('Finished importing <i>' + file.name + '</i>');
            })
            .catch(function(error) {
                Utility.showError(error);
                NProgress.done();
            });
    }

    static createDiffList(data, append) {
        if (!append) {
            Loader.loadedDiffObjects = [];
            $('#diffsList').html('');
        }
        data.forEach(function(diff) {

            var d = new Diff(diff.BaseUrl, diff.Commit, diff.ParentCommit, diff.SrcFileName, diff.DstFileName);
            d.id = diff.Id;
            Loader.loadedDiffObjects.push(d);
            $('#diffsList').append(d.generateTag());
            // console.log(d);

        });
        console.log(JSON.stringify(Loader.loadedDiffObjects));

        // var strg = JSON.stringify((Loader.loadedDiffObjects[0], function (key, value) {
        //     if (value && typeof value === 'object') {
        //         var replacement = {};
        //         for (var k in value) {
        //             if (Object.hasOwnProperty.call(value, k)) {
        //                 replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
        //             }
        //         }
        //         return replacement;
        //     }
        //     return value;
        // }));
        // console.log(strg);
        GUI.recalcDiffListHeight();
        NProgress.done();

        new BootstrapMenu('#diffItem', {
            fetchElementData: function($elem) {
                return $elem;
            },
            actions: [{
                name: 'Show raw SRC',
                iconClass: 'fa-file-text-o',
                onClick: function(item) {
                    window.open($(item).data('rawsrcurl'),'_src');
                }
            }, {
                name: 'Show raw DST',
                iconClass: 'fa-file-text',
                onClick: function(item) {
                    window.open($(item).data('rawdsturl'),'_dst');
                }
            }, {
                name: 'Inspect Commit',
                iconClass: 'fa-github',
                onClick: function(item) {
                    var commitUrl = 'https://github.com/' + $(item).find('.userRepo').text() + '/commit/' + $(item).data('commit') + '/' + $(item).data('filename');

                    window.open(commitUrl ,'_inspect');
                }
            }]
        });
    }

}
export default Loader;
