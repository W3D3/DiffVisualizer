/*global require describe it*/
// Import chai.
let chai = require('chai');

// Tell chai that we'll be using the "should" style assertions.
chai.should();

// Import the Rectangle class.
import Utility from '../src/Utility';

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
      var string = '1234MID567';
      var expected = [ '1234', 'MID', '567' ];
      Utility.splitRange(string, 4, 3).should.deep.equal(expected);
    });

    it('splits values properly', () => {
      var string = '1234RIGHT';
      var expected = [ '1234', 'RIGHT' ];
      Utility.splitValue(string, 4).should.deep.equal(expected);
    });
  });

  describe('#htmlescape operations', () => {
    it('escapes html tags', () => {
      var string = 'normalcode<script>console.log("XSS")</script>normalcode';
      var expected = 'normalcode&lt;script&gt;console.log("XSS")</script>normalcode';
      //escape from character 10 to character 25
      Utility.escapeSubpart(string, 10, 25).should.deep.equal(expected);
      //nothing to escape
      Utility.escapeSubpart(string, 0, 10).should.deep.equal(string);
    });

    it('escapes &', () => {
      var string = '&amp;';
      var expected = '&amp;amp;';
      Utility.escapeSubpart(string, 0, 4).should.deep.equal(expected);
    });
  });
});
