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
    name: "Pamela",
    username: "pamela",
    password: "12345678",
    c_password: "12345678",
}

var user2a = {
    username: "pamela",
    password: "12345678",
}

var invalid_quote = {
    quoted_by: "test",
    quote: "test",
}

describe('When the user entered invalid quote information and clicks ‘Add Quote’, the user is redirected to Dashboard and the validation error appears. The quote should not appear on the ‘Inspirational Quotes’ section.', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        });


    });     
    it("When the user entered invalid quote information and clicks ‘Add Quote’, the user is redirected to Dashboard and the validation error appears. The quote should not appear on the ‘Inspirational Quotes’ section.", function(done){
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
                    user2a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/login')
                    .type('form')
                    .send(user2a)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string("/dashboard");
                        request.get(base_url)
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            invalid_quote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            request.post(base_url + '/create-quote')
                            .type('form')
                            .send(invalid_quote)
                            .then(res => {
                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                expect(redirect_url).to.have.string("/dashboard");
                                expect(res.text).to.have.string("Quoted By should be at least 5 characters");
                                expect(res.text).to.have.string("Quote should be at least 10 characters");
                                expect(res.text).to.not.have.string(invalid_quote.quoted_by);
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
            .catch(err =>{
                return done(err);
            })
        });        
    });
});