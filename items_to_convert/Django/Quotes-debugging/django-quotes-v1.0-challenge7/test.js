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

describe('(1 pt) When the user clicks ‘Remove from List’, the quote should be removed from the ‘Your Favorite Quotes’ section', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        });


    });     
    it("When the user clicks ‘Remove from List’, the quote should be removed from the ‘Your Favorite Quotes’ section", function(done){
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
                            var $html = jQuery(res.text);
                            var favorite = {};
                            var quote_id = $html.find("input.quote_id").val();
                            favorite.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            favorite.quote_id = quote_id;
                            request.post(base_url + '/move-to-favorites')
                            .type('form')
                            .send(favorite)
                            .then(res => {
                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                expect(redirect_url).to.have.string("/dashboard");
                                var $html = jQuery(res.text);
                                var favorite = {};
                                var favorite_id = $html.find("input.favorite_id").val();
                                favorite.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                favorite.favorite_id = favorite_id;
                                request.post(base_url + '/remove-from-favorites')
                                .type('form')
                                .send(favorite)
                                .then(res => {
                                    var $html = jQuery(res.text);
                                    var favorite_quotes = $html.find("#favorite_quotes tbody tr");
                                    var favorite = $html.find("#favorite_quotes");
                                    let redirect_url = res != undefined ? res.redirects[0] : "";
                                    expect(redirect_url).to.have.string("/dashboard");
                                    expect(favorite_quotes.length).to.equal(0);
                                    expect(favorite.text()).to.not.have.string(quote.quoted_by);
                                    expect(favorite.text()).to.not.have.string(quote.quote);
                                    done();
                                })
                                .catch(err =>{
                                    return done(err);
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

describe('(1 pt) When the user clicks ‘Remove from List’, the quote should only appear back to the ‘Inspirational Quotes’ section.', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        });


    });     
    it("When the user clicks ‘Remove from List’, the quote should only appear back to the ‘Inspirational Quotes’ section.", function(done){
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
                            var $html = jQuery(res.text);
                            var favorite = {};
                            var quote_id = $html.find("input.quote_id").val();
                            favorite.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            favorite.quote_id = quote_id;
                            request.post(base_url + '/move-to-favorites')
                            .type('form')
                            .send(favorite)
                            .then(res => {
                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                expect(redirect_url).to.have.string("/dashboard");
                                var $html = jQuery(res.text);
                                var favorite = {};
                                var favorite_id = $html.find("input.favorite_id").val();
                                favorite.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                favorite.favorite_id = favorite_id;
                                request.post(base_url + '/remove-from-favorites')
                                .type('form')
                                .send(favorite)
                                .then(res => {
                                    var $html = jQuery(res.text);
                                    var favorite_quotes = $html.find("#favorite_quotes tbody tr");
                                    var inspirational_quotes = $html.find("#inspirational_quotes tbody tr");
                                    var inspirational = $html.find("#inspirational_quotes");
                                    var favorite = $html.find("#favorite_quotes");
                                    let redirect_url = res != undefined ? res.redirects[0] : "";
                                    expect(redirect_url).to.have.string("/dashboard");
                                    expect(favorite_quotes.length).to.equal(0);
                                    expect(favorite.text()).to.not.have.string(quote.quoted_by);
                                    expect(favorite.text()).to.not.have.string(quote.quote);
                                    expect(inspirational.text()).to.have.string(quote.quoted_by);
                                    expect(inspirational.text()).to.have.string(quote.quote);
                                    done();
                                })
                                .catch(err =>{
                                    return done(err);
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