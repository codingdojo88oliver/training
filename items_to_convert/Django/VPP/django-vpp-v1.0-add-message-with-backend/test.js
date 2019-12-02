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

var brian = {
    name: "Brian",
    email: "brian@datacompass.com",
    password: "password",
    c_password: "password"
}

var user = {
    email: "brian@datacompass.com",
    password: "password"
}

describe('(1 pt) Creating a virtual paper plane with less than 6 characters secret message should display this validation error: Message should be at least 6 characters', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("message should be at least 6 characters", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            brian.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url +'/register')
            .type('form')
            .send(brian)
            .then(res => {
                var $html = jQuery(res.text);
                user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var plane = {
                            message: "test"
                        };
                        plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-plane')
                        .type('form')
                        .send(plane)
                        .then(res => {
                            expect(res.text).to.have.string("Message should be at least 6 characters");
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
            .catch(err =>{
                return done(err);
            })
        })
    })

})

describe('(1 pt) Creating a virtual paper plane with empty secret message should display this validation error: Message is required', function(){
    this.timeout(15000);
    it("should require the message.", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var plane = {
                        message: ""
                    };
                    plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-plane')
                    .type('form')
                    .send(plane)
                    .then(res => {
                        expect(res.text).to.have.string("Message is required");
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
        });
    })
})

describe('(1 pt) Upon successful virtual paper plane creation, it should notify user with message: You just created a virtual paper plane!', function(){
    this.timeout(15000);
    it("should notify the user that a virtual paper plane has been successfully created.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                var $html = jQuery(res.text);
                var plane = {
                    message: "A secret message 1"
                };            
                plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/create-plane')
                .type('form')
                .send(plane)
                .then(res => {
                    expect(res.text).to.have.string("You just created a virtual paper plane!");
                    done();
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err =>{
                return done(err);
            })
        });
    })
})

describe('(2 pts) It should redirect user back to /dashboard page upon successful virtual paper plane creation', function(){
    this.timeout(15000);
    it("should redirect user back to /dashboard page upon successful virtual paper plane creation", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var plane = {
                        message: "A secret test message 2"
                    };
                    plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/create-plane')
                    .type('form')
                    .send(plane)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string("/dashboard");
                        expect(res.text).to.have.string("Ready");
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
        });
    });
});

