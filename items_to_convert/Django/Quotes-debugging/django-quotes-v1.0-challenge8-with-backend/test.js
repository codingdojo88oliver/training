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

var user1 = {
    name: "Oliver",
    username: "oliver",
    password: "12345678",
    c_password: "12345678",    
}

var user1a = {
    username: "oliver",
    password: "12345678",    
}

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

var quote = {
    quoted_by: "Albert Einstein",
    quote: "Imagination is more important than knowledge.",
}

describe('(1 pt) The Delete button should only appear on the quote that has been created by the logged user.', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        });
    });     
    it("The Delete button should only appear on the quote that has been created by the logged user.", function(done){
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
                        var $html = jQuery(res.text);
                        quote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-quote')
                        .type('form')
                        .send(quote)
                        .then(res => {
                            let redirect_url = res != undefined ? res.redirects[0] : "";
                            expect(redirect_url).to.have.string("/dashboard");
                            expect(res.text).to.have.string("delete-button");

                            request.get(base_url)
                            .end(function(err, res){
                                var $html = jQuery(res.text);
                                user1.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                request.post(base_url + '/register')
                                .type('form')
                                .send(user1)
                                .then(res => {
                                        var $html = jQuery(res.text);
                                        user1a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                        request.post(base_url + '/login')
                                        .type('form')
                                        .send(user1a)
                                        .then(res => {
                                            let redirect_url = res != undefined ? res.redirects[0] : "";
                                            expect(redirect_url).to.have.string("/dashboard");
                                            expect(res.text).to.not.have.string("delete-button");
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
                        .catch(err =>{
                            return done(err);
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