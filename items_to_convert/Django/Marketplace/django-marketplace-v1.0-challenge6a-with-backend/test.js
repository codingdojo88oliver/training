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
    first_name: "Jackmerius",
    last_name: "Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password", 
};

var user3 = {
    first_name: "Bismo",
    last_name: "Funyuns",
    email: "bismo@funyuns.com",
    password: "password",
    c_password: "password",
};

// is just user2's login creds
var user5 = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

var user6 = {
    email: "bismo@funyuns.com",
    password: "password",    
}

var random_item_name = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var random_item_price = Math.floor(Math.random() * 100000) + 10;
var random_item_description = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

var ad = {
    name: "five",
    price: 5,
    description: "Lorem ipsum dolor sit amet",
    category: 1,
}

var ad1 = {
    name: "legit item",
    price: 0,
    description: "Lorem ipsum dolor sit amet",
    category: 1,
}

var ad2 = {
    name: random_item_name,
    price: random_item_price,
    description: random_item_description,
}

var ad3 = {
    name: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    price: Math.floor(Math.random() * 100000) + 10,
    description: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    category: 1,
}


describe('(1 pt) When the user clicks on the ‘Negotiate’ button, the product should be removed from the ‘Products for Sale’ list.', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("When the user clicks on the ‘Negotiate’ button, the product should be removed from the ‘Products for Sale’ list.", function(done){
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
                        request.get(base_url + '/add-product')
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            ad2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            category_id = $html.find('#category').find(":selected").val();
                            ad2.category = category_id;
                            request.post(base_url + '/create-product')
                            .type('form')
                            .send(ad2)
                            .then(res => {
                                request.get(base_url)
                                .end(function(err, res){
                                    var $html = jQuery(res.text);
                                    user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                    request.post(base_url + '/register')
                                    .type('form')
                                    .send(user3)
                                    .then(res => {        
                                        request.get(base_url)
                                        .end(function(err, res){
                                            var $html = jQuery(res.text);
                                            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                            request.post(base_url + '/login')
                                            .type('form')
                                            .send(user6)
                                            .then(res => { 
                                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                                expect(redirect_url).to.have.string("/dashboard");
                                                var $html = jQuery(res.text);
                                                var product = {
                                                    product_id: $html.find('input[name=product_id]').val(),
                                                    csrfmiddlewaretoken: $html.find('input[name=csrfmiddlewaretoken]').val(),
                                                    price: ad2.price - 10,
                                                }
                                                request.post(base_url + '/negotiate')
                                                .type('form')
                                                .send(product)
                                                .then(res => {
                                                    let redirect_url = res != undefined ? res.redirects[0] : "";
                                                    expect(redirect_url).to.have.string("/dashboard");
                                                    var $html = jQuery(res.text);
                                                    var other_products = $html.find("#other-products").text();
                                                    expect(other_products).to.not.have.string(random_item_name);
                                                    expect(other_products).to.not.have.string('$'+random_item_price);
                                                    done();
                                                })
                                                .catch(err =>{
                                                    return done(err);
                                                });
                                            })
                                            .catch(err =>{
                                                return done(err);
                                            });
                                        });
                                    })
                                    .catch(err =>{
                                        return done(err);
                                    });
                                });
                            })
                            .catch(err =>{
                                return done(err);
                            })
                        })
                    })
                    .catch(err =>{
                        return done(err);
                    });
                });
            })
            .catch(err =>{
                return done(err);
            });
        });
    })
});

describe('(1 pt) When the user clicks on the ‘Negotiate’ button, the product should reflect at the logged user’s  ‘Items I am Negotiating’ with the product name and the new negotiated price.', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("When the user clicks on the ‘Negotiate’ button, the product should reflect at the logged user’s  ‘Items I am Negotiating’ with the product name and the new negotiated price.", function(done){
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
                        request.get(base_url + '/add-product')
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            ad3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            category_id = $html.find('#category').find(":selected").val();
                            ad3.category = category_id;
                            request.post(base_url + '/create-product')
                            .type('form')
                            .send(ad3)
                            .then(res => {
                                request.get(base_url)
                                .end(function(err, res){
                                    var $html = jQuery(res.text);
                                    user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                    request.post(base_url + '/register')
                                    .type('form')
                                    .send(user3)
                                    .then(res => {        
                                        request.get(base_url)
                                        .end(function(err, res){
                                            var $html = jQuery(res.text);
                                            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                            request.post(base_url + '/login')
                                            .type('form')
                                            .send(user6)
                                            .then(res => { 
                                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                                expect(redirect_url).to.have.string("/dashboard");
                                                var $html = jQuery(res.text);
                                                var product = {
                                                    product_id: $html.find('input[name=product_id]').val(),
                                                    csrfmiddlewaretoken: $html.find('input[name=csrfmiddlewaretoken]').val(),
                                                    price: ad3.price - 10,
                                                }
                                                request.post(base_url + '/negotiate')
                                                .type('form')
                                                .send(product)
                                                .then(res => {
                                                    let redirect_url = res != undefined ? res.redirects[0] : "";
                                                    expect(redirect_url).to.have.string("/dashboard");
                                                    var $html = jQuery(res.text);
                                                    var negotiating_products = $html.find("#negotiating-products").text();
                                                    expect(negotiating_products).to.have.string(ad3.name);
                                                    expect(negotiating_products).to.have.string('$'+ad3.price);
                                                    done();
                                                })
                                                .catch(err =>{
                                                    return done(err);
                                                });
                                            })
                                            .catch(err =>{
                                                return done(err);
                                            });
                                        });
                                    })
                                    .catch(err =>{
                                        return done(err);
                                    });
                                });
                            })
                            .catch(err =>{
                                return done(err);
                            })
                        })
                    })
                    .catch(err =>{
                        return done(err);
                    });
                });
            })
            .catch(err =>{
                return done(err);
            });
        });
    })
});

describe('(1 pt) When the seller logs in to the Dashboard page, the negotiated product should display the negotiated amount and the user who is negotiating for the product. The ‘Approve’ button should also be added.', function(){
    this.timeout(15000);
    it("When the seller logs in to the Dashboard page, the negotiated product should display the negotiated amount and the user who is negotiating for the product. The ‘Approve’ button should also be added.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {        
                var $html = jQuery(res.text);
                var price = ad3.price - 10;
                var my_products = $html.find("#my-products").text();
                expect(my_products).to.have.string(ad3.name);
                expect(my_products).to.have.string('$'+price);
                expect(my_products).to.have.string("Approve");      
                done();                
            })
            .catch(err =>{
                return done(err);
            });
        });
    });
});

describe('(1 pt) When other users log in. The product under negotiation should not appear under ‘Products for Sale’ section.', function(){
    this.timeout(15000);
    it("When other users log in. The product under negotiation should not appear under ‘Products for Sale’ section.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user6)
            .then(res => {        
                var $html = jQuery(res.text);
                var price = ad3.price - 10;
                var other_products = $html.find("#other-products").text();
                var negotiating_products = $html.find("#negotiating-products").text();
                expect(other_products).to.not.have.string(ad3.name);
                expect(other_products).to.not.have.string('$'+price);

                expect(negotiating_products).to.have.string(ad3.name);
                expect(negotiating_products).to.have.string('$'+price);   
                done();                
            })
            .catch(err =>{
                return done(err);
            });
        });
    })
});

