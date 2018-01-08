/* global $ */
/**
 * @file Uploading and parsing JSON diff lists
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import Dropzone from 'dropzone';
import axios from 'axios';
import NProgress from 'nprogress';
import BootstrapMenu from 'bootstrap-menu';

import Utility from './Utility';
import GUI from './GUI';
import Settings from './Settings';
import Diff from './Diff';

// import _ from 'lodash';

class Loader {
    constructor() {
        // var me = this;
        Loader.loadedDiffObjects = [];
        // Configure dropzone
        Dropzone.options.jsonUploader = {
            paramName: 'file', // The name that will be used to transfer the file
            dictDefaultMessage: 'Import as JSON file (Drag and Drop)',
            maxFilesize: 2, // MB
            accept(file, done) {
                // accept all files for now
                // console.log(file);
                NProgress.configure({
                    parent: '#jsonUploader',
                });
                NProgress.start();
                done();
            },
            acceptedFiles: '.json',
            maxFiles: 1,
            success: Loader.loadDiffsFromFile,
            error(file, err, xhr) {
                // console.log(file);
                NProgress.done();
                this.removeAllFiles();

                if (xhr) {
                    Utility.showError(`Error parsing file - ${err.error}`);
                    return;
                }
                if (!file.accepted) {
                    Utility.showWarning('Invalid filetype. Only .json is allowed.');
                }
            },
            init() {
                this.on('addedfile', function() {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                });
            },
        };

        // show all the already uploaded elements
        Loader.showUploadedElements();
    }

    static showUploadedElements() {
        // var me = this;
        const alreadyUploaded = Settings.getAllFiles();
        $('#uploadedFiles').html('');
        alreadyUploaded.forEach((filename) => {
            $('#uploadedFiles').append(`<a href="#" class="list-group-item fileButton" data-key="${filename}"> ${filename} <i class="fa fa-times pull-right delete-set"></i></a> `);
            // <i class="fa fa-times pull-right" style="color: red"></i></a>
        });

        $('.fileButton').on('click', function() {
            NProgress.configure({
                parent: '#uploadedFiles',
            });
            NProgress.start();
            $(this).parent().find('.fileButton').removeClass('active');
            $(this).addClass('active');
            Loader.createDiffList(Settings.loadFile($(this).data('key')));
            Utility.showSuccess(`Finished loading <i>${$(this).data('key')}</i>`);
        });

        $('.delete-set').on('click', function() {
            const keyToBeDeleted = $(this).parent().data('key');
            Settings.deleteFile(keyToBeDeleted);
            $(this).parent().remove();
            Utility.showSuccess(`Deleted <i>${keyToBeDeleted}</i> from saved sets.`);
        });
    }

    static loadDiffsFromFile(file, filename) {
        axios.get(`/uploads/${filename}`)
            .then((response) => {
                Settings.saveFile(file.name, response.data);
                Loader.showUploadedElements();
                Loader.createDiffList(response.data);

                Utility.showSuccess(`Finished importing <i>${file.name}</i>`);
            })
            .catch((error) => {
                Utility.showError(error);
                NProgress.done();
            });
    }

    static createDiffList(data, append) {
        if (!append) {
            Loader.loadedDiffObjects = [];
            $('#diffsList').html('');
        }
        data.forEach((diff) => {
            const d = new Diff();
            d.createFromObject(diff);
            const index = Loader.loadedDiffObjects.push(d) - 1;
            $('#diffsList').append(d.generateTag(index));
        });

        GUI.recalcDiffListHeight();
        NProgress.done();

        new BootstrapMenu('#diffItem', {
            fetchElementData($elem) {
                return $elem;
            },
            actions: [{
                name: 'Show raw SRC',
                iconClass: 'fa-file-text-o',
                onClick(item) {
                    window.open(Loader.loadedDiffObjects[$(item).data('index')].rawSrcUrl, '_src');
                },
            }, {
                name: 'Show raw DST',
                iconClass: 'fa-file-text',
                onClick(item) {
                    window.open(Loader.loadedDiffObjects[$(item).data('index')].rawDstUrl, '_dst');
                },
            }, {
                name: 'Inspect Commit',
                iconClass: 'fa-github',
                onClick(item) {
                    window.open(Loader.loadedDiffObjects[$(item).data('index')].commitUrl, '_inspect');
                },
            }],
        });
    }
}
export default Loader;
