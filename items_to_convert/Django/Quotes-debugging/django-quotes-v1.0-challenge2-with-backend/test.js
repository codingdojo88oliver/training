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
    username: "jacktacktheritrix",
    password: "password",
    c_password: "password",  
};

// an invalid email password combination
var user6 = {
    username: "jacktacktheritrix",
    password: "password1"
};

describe('(1 pt) Form validation for login: Invalid username and password combination', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    }); 
    //register the username first, then login with using wrong password
    it("Should not allow unauthorized login", function(done) {
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
                    user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/login')
                    .type('form')
                    .send(user6)
                    .then(res => {
                        expect(res.text).to.have.string("Invalid username and password combination");
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

describe('(1 pt) The user should not be able to access /dashboard without logging in first.', function(){
    this.timeout(15000);
    it("The user should not be able to access ‘/dashboard’ without logging in first.", function(done) {
        request.get(base_url + '/logout')
        .end(function(err, res){
            request.get(base_url + '/dashboard')
            .end(function(err, res){
                expect(res.text).to.have.string("Invalid session")
                expect(res.text).to.not.have.string("logout");
                expect(res.text).to.have.string("Login");
                expect(res.text).to.have.string("Register");
                done();
            });
        })    
    })
})