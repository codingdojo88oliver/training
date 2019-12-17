const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
const $ = global.jQuery = require('jquery')(window);
var superagent = require('superagent');
request = superagent.agent();

var chai = require('chai');  
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var base_url = "http://localhost:8000";


describe('(1 pt) Test Index page status code', function(){
    this.timeout(15000);
    it("should be able to access index page", function(done){
        request.get(base_url)
                .then(res => {
                    expect(res.status).to.equal(200);
                    done();
                })
                .catch(err =>{
                    return done(err);
                })
        })

});
