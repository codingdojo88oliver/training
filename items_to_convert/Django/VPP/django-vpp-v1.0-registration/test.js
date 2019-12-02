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
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",
    country: "Taiwan",
    interests: "sports",
    language: "english",    
};


// expected to not be inserted in db (a language error)
var user4 = {
    name: "Leoz Maxwell Jilliumz",
    email: "leozmax@jilliumz.com",
    password: "password",
    c_password: "password",
    country: "United States",
    interests: "sports",
};

// expected to not be inserted in db (an interest error)
var user4b = {
    name: "Leoz Maxwell Jilliumz",
    email: "leozmax@jilliumz.com",
    password: "password",
    c_password: "password",
    country: "United States",
    language: "english",
};

describe('(1 pt) Form validations for interest field during registration: Should select at least 1 interest', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("should require at least 1 interest", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4b.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4b)
            .then(res => {
                expect(res.text).to.have.string("Should select at least 1 interest");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})

describe('(1 pt) Form validations for language field during registration: Should select at least 1 language', function(){
    this.timeout(15000);
    it("should require at least 1 language", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4)
            .then(res => {
                expect(res.text).to.have.string("Should select at least 1 language");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})

describe('(3 pts) It should redirect user to /dashboard page upon successful registration and display the user’s email, country, interests and languages', function(){
    this.timeout(15000);
    it("should redirect user to /dashboard page upon successful registration and display the user’s email, country, interests and languages", function(done){
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
                expect(res.text).to.have.string(user2.email);
                expect(res.text).to.have.string(user2.country);
                expect(res.text).to.have.string(user2.interests);
                expect(res.text).to.have.string(user2.language);
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})