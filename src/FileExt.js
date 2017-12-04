class FileExt {

    constructor() {
        this.fileMap = new Map();
        this.fileMap.set('bat', 'bat');
        this.fileMap.set('c', 'c');
        this.fileMap.set('coffee', 'coffeescript');
        this.fileMap.set('cpp', 'cpp');
        this.fileMap.set('cs', 'csharp');
        this.fileMap.set('css', 'css');
        this.fileMap.set('dockerfile', 'dockerfile');
        this.fileMap.set('fs', 'fsharp');
        this.fileMap.set('f#', 'fsharp');
        this.fileMap.set('go', 'go');
        this.fileMap.set('hb', 'handlebars');
        this.fileMap.set('html', 'html');
        this.fileMap.set('htm', 'html');
        this.fileMap.set('xhtml', 'html');
        this.fileMap.set('rss', 'html');
        this.fileMap.set('ini', 'ini');
        this.fileMap.set('java', 'java');
        this.fileMap.set('js', 'javascript');
        this.fileMap.set('json', 'json');
        this.fileMap.set('less', 'less');
        this.fileMap.set('lua', 'lua');
        this.fileMap.set('md', 'markdown');
        this.fileMap.set('markdown', 'markdown');
        this.fileMap.set('mkdn', 'markdown');
        this.fileMap.set('mkd', 'markdown');
        this.fileMap.set('mdwn', 'markdown');
        this.fileMap.set('mdtxt', 'markdown');
        this.fileMap.set('mdtext', 'markdown');
        this.fileMap.set('text', 'markdown');
        this.fileMap.set('objectivec', 'objective-c');
        this.fileMap.set('mm', 'objective-c');
        this.fileMap.set('objc', 'objective-c');
        this.fileMap.set('php', 'php');
        this.fileMap.set('powershell', 'powershell');
        this.fileMap.set('ps', 'powershell');
        this.fileMap.set('python', 'python');
        this.fileMap.set('py', 'python');
        this.fileMap.set('gyp', 'python');
        this.fileMap.set('r', 'r');
        this.fileMap.set('gyp', 'python');
        this.fileMap.set('ruby', 'ruby');
        this.fileMap.set('rb', 'ruby');
        this.fileMap.set('gemspec', 'ruby');
        this.fileMap.set('scss', 'scss');
        this.fileMap.set('sql', 'sql');

        //continue here...
        this.fileMap.set('xml', 'xml');
        this.fileMap.set('ts', 'typescript');
    }

    getLanguageForExt(ext) {
        var result = this.fileMap.get(ext);
        if(result){
            return result;
        } else {
            //return ext;
            return 'plaintext';
        }
    }

    getLanguageForExtHLJS(ext) {
        return this.getLanguageForExt(ext).replace('-', '');
    }
} export default FileExt;
