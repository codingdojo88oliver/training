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

var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};

// is just user2 login creds
var user5 = {
    email: "jack@tacktheritrix.com",
    password: "password"
};


describe('(1 pt) It should redirect to dashboard on successful login and display the email and name of the user', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });     
    it("should redirect to dashboard on successful login", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                request.get(base_url)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/login')
                    .type('form')
                    .send(user5)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string("/dashboard");
                        expect(res.text).to.have.string(user2.name);
                        expect(res.text).to.have.string(user2.email);
                        done();

                    })
                    .catch(err =>{
                        return done(err);
                    })
                })  
            })
            .catch(err =>{
                return done(err);
            })
        })  
    })
})