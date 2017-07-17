/*global require describe it */
// Import chai.
const chai = require('chai');
const chaiHtml  = require('chai-html');
const expect    = require('chai').expect;
// Register the plugin
chai.use(chaiHtml);
// Tell chai that we'll be using the "should" style assertions.
chai.should();

// Import the Marker class.
import Marker from '../src/Marker';


describe('Marker', () => {

  describe('#generating a tag', () => {

    it('returns empty closing tag if endmarker', () => {
      var marker = new Marker(1, 44, 'INSERT', true, 'src');
      marker.generateTag().should.equal('</span>');
    });

    it('return valid marker html if no endmarker', () => {
      var marker = new Marker(1, 44, 'INSERT', false, 'src');
      var htmlstring = marker.generateTag();
      expect(htmlstring).html.to.equal('<span class="INSERT scriptmarker" id="src1">');
    });
  });

  describe('#properties', () => {


  });
});
