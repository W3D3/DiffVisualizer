/*global require describe it beforeEach*/
// Import chai.
let chai = require('chai');

// Tell chai that we'll be using the "should" style assertions.
chai.should();

// Import the Rectangle class.
import DiffDrawer from '../src/DiffDrawer';


describe('DiffDrawer', () => {
  let dd;

  describe('#job', () => {
    beforeEach(() => {
      // Create a new Rectangle object before every test.
      dd = new DiffDrawer();
    });

    it('should not be active initially', () => {
      dd.checkIfCurrentJob().should.equal(false);
      dd.jobId.should.not.equal(DiffDrawer.currentJobId);
    });

    it('should be active after setting as current', () => {
      dd.checkIfCurrentJob().should.equal(false);
      dd.setJobId(1);
      dd.setAsCurrentJob();
      dd.checkIfCurrentJob().should.equal(true);
    });

    it('should become inactive when other job with different set id gets active', () => {
      dd.checkIfCurrentJob().should.equal(false);
      dd.setJobId(1);
      dd.setAsCurrentJob();
      let dd2 = new DiffDrawer('src','dst');
      dd2.setJobId(2);
      dd2.setAsCurrentJob();
      dd.checkIfCurrentJob().should.equal(false);
      dd2.checkIfCurrentJob().should.equal(true);
    });

    it('should become inactive when other job gets active', () => {

      dd.setJobId(null);
      dd.setAsCurrentJob();
      let dd2 = new DiffDrawer('src','dst'); //differnet src and dst
      dd2.setJobId(null);
      dd2.setAsCurrentJob();
      dd.checkIfCurrentJob().should.equal(false);
      dd2.checkIfCurrentJob().should.equal(true);
    });

    it('should terminate when the new job has another matcher', () => {
      dd.setMatcher(1);
      dd.setJobId(null);
      dd.setAsCurrentJob();
      let dd2 = new DiffDrawer();

      dd2.setMatcher(2); //different matcher
      dd2.setJobId(null);
      dd2.setAsCurrentJob();
      dd.checkIfCurrentJob().should.equal(false);
      dd2.checkIfCurrentJob().should.equal(true);
    });

    it('should not terminate when the new job is the same', () => {
      dd.setMatcher(1);
      dd.setJobId(null);
      dd.setAsCurrentJob();
      let dd2 = new DiffDrawer();
      dd2.setJobId(null);
      dd2.setMatcher(1); //different matcher
      dd2.setAsCurrentJob();
      dd.checkIfCurrentJob().should.equal(true);
      dd2.checkIfCurrentJob().should.equal(true);
    });
  });
});
