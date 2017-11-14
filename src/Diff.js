/**
 * @file Diff Object
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

// import Utility from './Utility';
// import _ from 'lodash';
import hash from 'object-hash';

class Diff {
    constructor(baseUrl, commit, parentCommit, srcFileName, dstFileName) {
        this._baseUrl = baseUrl;
        this._commit = commit;
        this._parentCommit = parentCommit;
        this._srcFileName = srcFileName;
        this._dstFileName = dstFileName;
    }

    createFromObject(obj) {
        this._id = obj.id;
        this._baseUrl = obj.baseUrl;
        this._commit = obj.commit;
        this._parentCommit = obj.parentCommit;
        this._srcFileName = obj.srcFileName;
        this._dstFileName = obj.dstFileName;
    }

    get baseUrl() {
        return this._baseUrl.replace(/\/$/, '');
    }

    set baseUrl(baseUrl) {
        this._baseUrl = baseUrl;
    }

    get id() {
        if(this._id) {
            return this._id;
        } else {
            return hash(this._commit + this._parentCommit + this._dstFileName);
        }
    }

    get shortId() {
        return String(this.id).substring(0,8);
    }

    set id(id) {
        this._id = id;
    }

    // set edited(state) {
    //     this._edited = state;
    // }
    //
    // get edited() {
    //     return this._edited;
    // }

    get commit() {
        return this._commit;
    }

    get parentCommit() {
        return this._parentCommit;
    }

    get srcFileName() {
        return this._srcFileName;
    }

    get dstFileName() {
        return this._dstFileName;
    }

    get userRepo() {
        return this._baseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?(github\.com\/)/, '');
    }

    get localBaseUrl() {
        return `http://${window.location.host}/github/${this.userRepo}`;
    }

    /**
     * [returns title for diff]
     * @return {[string]} [human readable title containing the filename and possible renaming]
     */
    get title() {
        if(!this._srcFileName) return '';
        var diffTitle = this._srcFileName.replace(/^.*[\\\/]/, '');
        if (this._srcFileName != this._dstFileName) {
            diffTitle += ' &#8658; ' + this._dstFileName.replace(/^.*[\\\/]/, '');
        }

        return diffTitle;
    }

    get rawSrcUrl() {
        return  this.localBaseUrl + '/' + this.parentCommit + '/' + this._srcFileName;
    }

    get rawDstUrl() {
        return  this.localBaseUrl + '/' + this.commit + '/' + this._dstFileName;
    }

    get commitUrl() {
        return this.baseUrl + '/commit/' + this.commit + '/' + this.dstFileName;
    }

    /**
     * generates a list-group-item tag with the information of the diff object attached
     * @param  {[integer]} index if an index is provided, all data attributes are omitted except data-index with the specified index
     *                           this is useful if storing the data itself somewhere else.
     * @return {[string]}        returns list-group-item html string with all the attributes of this object as data attributes
     */
    generateTag(index) {
        // if(!this.id) {
        //     this.id = hash(this._commit + this._parentCommit + this._dstFileName);
        // }
        if(index < 0)
        {
            return `<a href="#" class="list-group-item" id="diffItem"\
                data-rawsrcurl="${this.rawSrcUrl}" data-rawdsturl="${this.rawDstUrl}" data-id="${this.id}" data-commit="${this.commit}"\
                data-filename="${this.dstFileName}">\
                <span class="label label-default">\
                ${String(this.id).substring(0,8)}</span><b> ${this.title}</b><br /><small class="userRepo">${this.userRepo}</small></a>`;
        } else {
            return `<a href="#" class="list-group-item" id="diffItem"\
                data-index="${index}" data-id="${this.id}">\
                <span class="label label-default">\
                ${String(this.id).substring(0,8)}</span><b> ${this.title}</b><br /><small class="userRepo">${this.userRepo}</small></a>`;

        }
    }

    /**
     * [toJSON]
     * @return {[object]} [mapping of json representation]
     */
    toJSON() {
        try {
            return {
                id: this.id,
                baseUrl: this.baseUrl,
                commit: this.commit,
                parentCommit: this.parentCommit,
                srcFileName: this.srcFileName,
                dstFileName: this.dstFileName
            };
        } catch (e) {
            return '';
        }
    }
}
export default Diff;
