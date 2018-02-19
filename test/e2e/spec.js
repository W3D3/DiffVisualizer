/* eslint-disable */
// spec.js
describe('DiffVisualizer', function() {
  it('should have a title', function() {
    browser.waitForAngularEnabled(false);
    var url = 'http://localhost:9999';
    browser.get(url);

    expect(browser.getTitle()).toEqual('Diff Visualizer');
  });
});
