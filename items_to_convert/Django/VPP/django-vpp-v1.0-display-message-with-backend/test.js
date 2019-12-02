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

describe('(2 pts) It should redirect user back to /dashboard page upon successful virtual paper plane creation', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });
    this.timeout(15000);
    it("should redirect user back to /dashboard page upon successful virtual paper plane creation", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            brian.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
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
                            message: "A secret test message 1"
                        };
                        plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-plane')
                        .type('form')
                        .send(plane)
                        .then(res => {
                            let redirect_url = res != undefined ? res.redirects[0] : "";
                            expect(redirect_url).to.have.string("/dashboard");
                            expect(res.text).to.not.have.string("06:42:08 Aug 08, 2019");
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
        });
    });
});

describe('(1 pt) Logged in user should be able to see his/her own virtual paper plane in planes/<id>', function(){
    this.timeout(15000);
    it("logged in user should be able to see his/her own virtual plane", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.my-plane").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    expect(res.text).to.have.string("A secret test message 1");
                    done();
                })
            })
            .catch(err =>{
                return done(err);
            })
        })        
    })    
})

