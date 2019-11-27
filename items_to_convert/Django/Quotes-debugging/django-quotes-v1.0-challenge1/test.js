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

// second test user inserted in db
var user2 = {
    name: "Jackmerius Tacktheritrix",
    username: "jacktacktheritrix",
    password: "password",
    c_password: "password",  
};

describe('(1 pt) It should redirect user to /dashboard page upon successful registration and display the user’s name and username', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });     
    this.timeout(15000);
    it("should redirect user to /dashboard page upon successful registration and display the user’s name and username", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                let redirect_url = res != undefined ? res.redirects[0] : "";
                expect(redirect_url).to.have.string("/dashboard");
                expect(res.text).to.have.string(user2.name);
                expect(res.text).to.have.string(user2.username);
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})