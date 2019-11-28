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

// an invalid email password combination
var user6 = {
    email: "jack@tacktheritrix.com",
    password: "password1"
};

// email does not exist
var user7 = {
    email: "1234567@gmail.com",
    password: "password"
}

describe('(1 pt) Form validation for login: Invalid email and password combination', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    }); 
    //register the email first, then login with using wrong password
    it("Should not allow unauthorized login", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                expect(res.text).to.have.string("User " + user2.name + " with email " + user2.email + " successfully registered!");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })     
    })
})

describe('(1 pt) Form validation for login: Email does not exist in the database', function(){
    this.timeout(15000);

    it("Should not allow unauthorized login", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7)
            .then(res => {
                expect(res.text).to.have.string("Email does not exist in the database");
                done();

            })
            .catch(err =>{
                return done(err);
            })
        })        
    });
})

describe('(1 pt) Form validation for login: Invalid email and password combination', function(){
    this.timeout(15000);
    it("Should not allow unauthorized login", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user6)
            .then(res => {
                expect(res.text).to.have.string("Invalid email and password combination");
                done();

            })
            .catch(err =>{
                return done(err);
            })
        })   
    })
})

describe('(1 pt) It should redirect to dashboard on successful login and display the email of the user, interests and languages..', function(){
    this.timeout(15000);
    it("should redirect to dashboard on successful login", function(done) {
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
})

describe('(1 pt) The user should not be able to access /dashboard without logging in first.', function(){
    this.timeout(15000);
    it("The user should not be able to access ‘/dashboard’ without logging in first.", function(done) {
        request.get(base_url + '/logout')
        .end(function(err, res){
            request.get(base_url + '/dashboard')
            .end(function(err, res){
                let redirect_url = res != undefined ? res.redirects[0] : "";
                expect(redirect_url).to.not.have.string("/dashboard");
                done();
            });
        })    
    })
})