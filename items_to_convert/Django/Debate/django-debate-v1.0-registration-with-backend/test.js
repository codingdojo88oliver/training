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

// second test user inserted in db
var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};


// expected to not be inserted in db (a password error)
var user4 = {
    name: "Samuel",
    email: "sam@datacompass.com",
    password: "12345",
    c_password: "12345",
    country: "United States",
};

// expected to not be inserted in db (a name error)
var user4b = {
    name: "KB",
    email: "ktonel@datacompass.com",
    password: "password",
    c_password: "password",
};

// expected to not be inserted in db (a c_password error)
var user4c = {
    name: "KB",
    email: "ktonel@datacompass.com",
    password: "password",
    c_password: "password1",
};


describe('(1 pt) Form validations for name field during registration: Name should be at least 3 characters', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("Name should be at least 3 characters", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4b.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4b)
            .then(res => {
                expect(res.text).to.have.string("Name should be at least 3 characters");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})

describe('(1 pt) Form validations for password field during registration: Password should be at least 6 characters', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("Password should be at least 6 characters", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4)
            .then(res => {
                expect(res.text).to.have.string("Password should be at least 6 characters");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})

describe('(1 pt) Form validations for c_password field during registration: Passwords do not match', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("Passwords do not match", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4c.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4c)
            .then(res => {
                expect(res.text).to.have.string("Passwords do not match");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})

describe('(1 pt) It should redirect user to /dashboard page upon successful registration and display the user’s name and email', function(){
    this.timeout(15000);
    it("should redirect user to /dashboard page upon successful registration and display the user’s name and email", function(done){
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
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
})