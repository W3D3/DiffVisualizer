/* global require describe it */
// Import the Utility class.
import Utility from '../src/Utility';
// Import chai.
const chai = require('chai');

// Tell chai that we'll be using the "should" style assertions.
chai.should();

// The fat arrow (=>) syntax is a new way to define
// functions in ES6. One feature that is different
// from the usual "function" keyword is that the scope
// is inherited from the parent, so there is no need to write
//
//   function() {
//     ...
//   }.bind(this)
//
// anymore. In this case we are not using "this" so the new
// syntax is just used for brevity.
describe('Utility', () => {
    describe('#opponent', () => {
        it('returns src for dst', () => {
            Utility.getOpponent('src').should.equal('dst');
        });
        it('returns dst for src', () => {
            Utility.getOpponent('dst').should.equal('src');
        });
    });

    describe('#array operations', () => {
        it('splits ranges properly', () => {
            const string = '1234MID567';
            const expected = ['1234', 'MID', '567'];
            Utility.splitRange(string, 4, 3).should.deep.equal(expected);
        });

        it('splits values properly', () => {
            const string = '1234RIGHT';
            const expected = ['1234', 'RIGHT'];
            Utility.splitValue(string, 4).should.deep.equal(expected);
        });
    });

    describe('#htmlescape operations', () => {
        it('escapes html tags', () => {
            const string = 'normalcode<script>console.log("XSS")</script>normalcode';
            const expected = 'normalcode&lt;script&gt;console.log("XSS")</script>normalcode';
            // escape from character 10 to character 25
            Utility.escapeSubpart(string, 10, 25).should.deep.equal(expected);
            // nothing to escape
            Utility.escapeSubpart(string, 0, 10).should.deep.equal(string);
        });

        it('escapes &', () => {
            const string = '&amp;';
            const expected = '&amp;amp;';
            Utility.escapeSubpart(string, 0, 4).should.deep.equal(expected);
        });
    });
});
