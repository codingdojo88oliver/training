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

// first test user inserted in db
var user1 = {
    first_name: "D'Squarius",
    last_name: "Green",
    email: "dsquarius@greenjr.com",
    password: "password",
    c_password: "password",
};

// second test user inserted in db
var user2 = {
    first_name: "Jackmerius",
    last_name: "Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password", 
};

// third test user inserted in db
// first to login (when testing the login feature)
// first to create plane with message: A secret test message 1
// second message: A secret message 2
// third message: A secret message 3
var user2a = {
    first_name: "Ozamataz",
    last_name: "Buckshank",
    email: "ozamataz@buckshank.com",
    password: "password",
    c_password: "password",
};

// expected to not be inserted in db
var user3 = {
    first_name: "K",
    last_name: "T",
    email: "djasperprobincrux@thethird.com",
    password: "six",
    c_password: "seven",
};

// is just user2's login creds
var user5 = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

// an invalid email password combination
var user6 = {
    email: "javarisjamarjavarison@lamar.com",
    password: "password1"
};

// 2nd test user inserted in db
var user7 = {
    first_name: "Bismo",
    last_name: "Funyuns",
    email: "bismo@funyuns.com",
    password: "password",
    c_password: "password",
};

// user7's login cred
var user7a = {
    email: "bismo@funyuns.com",
    password: "password",    
}

var ad = {
    name: "a",
    price: 0,
    description: "",
    category: 1,
}

var random_item_name = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var random_item_price = Math.floor(Math.random() * 100000) + 10;
var random_item_description = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// invalid ad
var ad1 = {
    name: "test product",
    price: 5,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",   
    category: 1, 
}

// first ad inserted
var ad2 = {
    name: random_item_name,
    price: random_item_price,
    description: random_item_description,
}

var ad3 = {
    name: "I will instantly be bought",
    price: 999,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
}

// 2nd ad inserted
var ad4 = {
    name: random_item_name + 'ad4',
    price: random_item_price + 4,
    description: random_item_description,
}

// 3rd ad inserted
var ad5 = {
    name: random_item_name + 'ad5',
    price: random_item_price + 4,
    description: random_item_description,
}



describe('(2 pts) Create the user registration feature', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("should redirect user to /dashboard page upon successful registration", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/dashboard")
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    // all validation errors
    it("First name and last name should be at least 2 characters, Password should be at least 6 characters, and Password and Confirm Password must match validations", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {
                expect(res.text).to.have.string("First name should be at least 2 characters");
                expect(res.text).to.have.string("Last name should be at least 2 characters");
                expect(res.text).to.have.string("Password should be at least 6 characters");
                expect(res.text).to.have.string("Passwords do not match");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
});

describe('(3 pts) Implement the login feature', function(){
    this.timeout(15000);
    it("should not allow the user to access dashboard without logging in first", function(done){
        request.get(base_url + '/logout')
        .end(function(err, res){
            request.get(base_url + '/dashboard')
            .end(function(err, res){
                expect(res.redirects[0]).to.have.string("/")
                done();
            })
        });
    });
    it("should redirect to dashboard on successful login", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/dashboard")
                done();

            })
            .catch(err =>{
                return done(err);
            })
        })
    })

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
    });
})

// current logged in user is user5
describe('(4 pts) Implement the Create Advertisement feature', function(){
    this.timeout(15000);
    it("logged in user should be able to view the /mytransactions page", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    expect(res.status).to.equal(200);
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })        
    })
    it("should have at least 4 categories", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var length = $html.find('#category > option').length;
                    expect(length).to.not.be.lessThan(4);
                    expect(res.status).to.equal(200);
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
        
    });

    // all validation errors
    it("Product name should be at least 5 characters, Price should be at least $1, Description should not be empty and not exceed 100 characters.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            ad.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/create-product')
            .type('form')
            .send(ad)
            .then(res => {
                expect(res.text).to.have.string("Product Name should be at least 5 characters");
                expect(res.text).to.have.string("Price should be at least $1");
                expect(res.text).to.have.string("Description should not be empty");
            })
            .catch(err =>{
                return done(err);
            })

            ad1.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/create-product')
            .type('form')
            .send(ad1)
            .then(res => {
                expect(res.text).to.have.string("Description should not exceed 100 characters");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })

    it("Upon a successful advertisement creation, the advertisement or product should reflect on the marketplace", function(done){
        request.get(base_url + '/mytransactions')
        .end(function(err, res){
            var $html = jQuery(res.text);
            ad2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            category_id = $html.find('#category').find(":selected").val();
            ad2.category = category_id;
            request.post(base_url + '/create-product')
            .type('form')
            .send(ad2)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    expect(res.text).to.have.string(random_item_name);
                    expect(res.text).to.have.string('$'+random_item_price);
                    done();
                })
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
});

// current logged in user is user5
describe('(6 pts) Implement the Buy feature', function(){
    this.timeout(15000);

    // user5 owns ad2
    it("Users should be able to see more details of the product", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var button = $html.find("button.buy").text();
                    expect(button).to.have.string("");
                    expect(res.text).to.have.string(random_item_name);
                    expect(res.text).to.have.string('$'+random_item_price);
                    expect(res.text).to.have.string(random_item_description);
                    expect(res.text).to.have.string(user2.first_name + ' T.');
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            });
        });
    });
    it("Logged in user shouldn't be able to see the buy button for own product", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var button = $html.find("button.buy").text();
                    expect(button).to.have.string("");
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    it("Logged in user should be able to see the buy button for other products", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user7)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var button = $html.find("button.buy").text();
                    expect(button).to.have.string("Buy")
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    it("Should redirect to /mytransactions page after successfully buying a product and product should then added to list of Items Bought", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);
            var href = $html.find("a.product").attr('href');
            request.get(base_url + href)
            .end(function(err, res){
                var $html = jQuery(res.text);
                var href_split = href.split("/");
                var product_id = href_split[href_split.length - 1];

                var buy = {
                    product: product_id,
                }
                buy.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();

                request.post(base_url + '/buy')
                .type('form')
                .send(buy)
                .then(res => {
                    var $html = jQuery(res.text);
                    var items_bought_text = $html.find('ul.items_bought').text();
                    expect(res.redirects[0]).to.have.string("/mytransactions");
                    expect(items_bought_text).to.have.string(random_item_name);
                    expect(items_bought_text).to.have.string('$'+random_item_price);
                    done();
                });
            });
        });
    })

    it("The bought product shouldn't then be displayed in /dashboard page", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            expect(res.text).to.not.have.string(random_item_name);
            expect(res.text).to.not.have.string('$'+random_item_price);
            done();
        });
    }); 

    // user5 posted ad2
    it("The bought product should be displayed in /mytransactions page under items sold for the user who posted it.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var items_sold_text = $html.find('ul.items_sold').text();
                    expect(items_sold_text).to.have.string(random_item_name);
                    expect(items_sold_text).to.have.string('$'+random_item_price);
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    }); 
});

describe('(8 pts) Implement the Negotiate feature', function(){
    this.timeout(15000);
    it("Logged in user shouldn't be able to see the negotiate button for own product", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    ad4.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    category_id = $html.find('#category').find(":selected").val();
                    ad4.category = category_id;
                    request.post(base_url + '/create-product')
                    .type('form')
                    .send(ad4)
                    .then(res => {
                        request.get(base_url + '/dashboard')
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            var href = $html.find("a.product").attr('href');
                            request.get(base_url + href)
                            .end(function(err, res){
                                var $html = jQuery(res.text);
                                var button = $html.find("button.negotiate").text();
                                expect(button).to.not.have.string("Negotiate")
                                done();
                            });
                        })
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
    it("Logged in user should be able to see the negotiate button for other products", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7a)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var button = $html.find("button.negotiate").text();
                    expect(button).to.have.string("Negotiate")
                    done();
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    })

    it("Asking Price should not be higher than the original price", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7a)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var href_split = href.split("/");
                    var product_id = href_split[href_split.length - 1];

                    var haggle = {
                        product: product_id,
                        price: ad4.price + 1,
                    }
                    haggle.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();

                    request.post(base_url + '/negotiate')
                    .type('form')
                    .send(haggle)
                    .then(res => {
                        var $html = jQuery(res.text);
                        expect(res.text).to.have.string("Asking price should not be higher than the original price posted.");
                        done();
                    });
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    });

    it("Asking price should not be lower than 70% of the original price.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7a)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var href_split = href.split("/");
                    var product_id = href_split[href_split.length - 1];
                    var amount = ad4.price * .31;
                    var asking_price = ad4.price - amount;
                    var haggle = {
                        product: product_id,
                        price: asking_price,
                    }
                    haggle.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();

                    request.post(base_url + '/negotiate')
                    .type('form')
                    .send(haggle)
                    .then(res => {
                        var $html = jQuery(res.text);
                        expect(res.text).to.have.string("Asking price should not be lower than 70% of the original price.");
                        done();
                    });
                });
            })
            .catch(err =>{
                return done(err);
            })
        })
    });

    it("Should be able to negotiate for product given the correct requirements", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7a)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.product").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var href_split = href.split("/");
                    var product_id = href_split[href_split.length - 1];
                    var amount = ad4.price * .1;
                    var asking_price = ad4.price - amount;
                    var haggle = {
                        product: product_id,
                        price: asking_price,
                    }
                    haggle.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();

                    request.post(base_url + '/negotiate')
                    .type('form')
                    .send(haggle)
                    .then(res => {
                        var $html = jQuery(res.text);
                        expect(res.text).to.not.have.string("Asking price should not be lower than 70% of the original price.");
                        expect(res.text).to.not.have.string("Asking price should not be higher than the original price posted.");
                        
                        var under_negotiation_text = $html.find('ul.under_negotiations').text();
                        expect(under_negotiation_text).to.have.string(random_item_name + 'ad4');
                        expect(under_negotiation_text).to.have.string('$'+ad4.price);
                        expect(under_negotiation_text).to.have.string('$'+asking_price);
                        done();
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
    });

    it("The negotiated product should be removed from the dashboard", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user7a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user7a)
            .then(res => {
                expect(res.text).to.not.have.string(ad4.name);
                expect(res.text).to.not.have.string('$'+ad4.price);
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    });

    it("Should be able to approve an asking price for a product.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var approve = {
                        csrfmiddlewaretoken: $html.find('input[name=csrfmiddlewaretoken]').val(),
                        negotiation_id: $html.find('input[name=negotiation_id]').val(),
                    }
                    request.post(base_url + '/approve')
                    .type('form')
                    .send(approve)
                    .then(res => {
                        var $html = jQuery(res.text);
                        var items_sold_text = $html.find('ul.items_sold').text();
                        var under_negotiation_text = $html.find('ul.under_negotiations').text();
                        var amount = ad4.price * .1;
                        var asking_price = ad4.price - amount;
                        expect(res.redirects[0]).to.have.string("/mytransactions");
                        expect(items_sold_text).to.have.string(ad4.name);
                        expect(items_sold_text).to.have.string('$'+asking_price);
                        expect(under_negotiation_text).to.not.have.string(ad4.name);
                        expect(under_negotiation_text).to.not.have.string('$'+asking_price);
                        
                    });
                });
                done();

            })
            .catch(err =>{
                return done(err);
            })
        })
    });

    it("Should be able to dismiss an asking price for a product.", function(done){
        //dismiss means: item will be removed from under_negotiation and will be displayed back in /dashboard

        //log in as user5 - check
        //redirect to /mytransactions - check
        //create a product - check
        //log in as user7a - check
        //click on a product - check
        //negotiate - check
        //log back in as user5 - check
        // redirect to /mytransactions - check
        // dismiss - check
        // expect statements
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            var csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            user5.csrfmiddlewaretoken = csrfmiddlewaretoken;
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                request.get(base_url + '/mytransactions')
                .end(function(err, res){
                    // create a product
                    var $html = jQuery(res.text);
                    ad5.csrfmiddlewaretoken = csrfmiddlewaretoken;
                    category_id = $html.find('#category').find(":selected").val();
                    ad5.category = category_id;
                    request.post(base_url + '/create-product')
                    .type('form')
                    .send(ad5)
                    .then(res => {
                        // log in as user7a
                        user7a.csrfmiddlewaretoken = csrfmiddlewaretoken;
                        request.post(base_url + '/login')
                        .type('form')
                        .send(user7a)
                        .then(res => {
                            //click on a product
                            var $html = jQuery(res.text);
                            var href = $html.find("a.product").attr('href');
                            request.get(base_url + href)
                            .end(function(err, res){
                                //negotiate
                                var $html = jQuery(res.text);
                                var href_split = href.split("/");
                                var product_id = href_split[href_split.length - 1];
                                var amount = ad5.price * .1;
                                var asking_price = ad5.price - amount;
                                var haggle = {
                                    product: product_id,
                                    price: asking_price,
                                }
                                haggle.csrfmiddlewaretoken = csrfmiddlewaretoken;

                                request.post(base_url + '/negotiate')
                                .type('form')
                                .send(haggle)
                                .then(res => {
                                    // log back in as user5
                                    user5.csrfmiddlewaretoken = csrfmiddlewaretoken;
                                    request.post(base_url + '/login')
                                    .type('form')
                                    .send(user5)
                                    .then(res => {

                                        // redirect to /mytransactions
                                        request.get(base_url + '/mytransactions')
                                        .end(function(err, res){
                                            // dismiss
                                            var $html = jQuery(res.text);
                                            var dismiss = {
                                                csrfmiddlewaretoken: csrfmiddlewaretoken,
                                                negotiation_id: $html.find('input[name=negotiation_id]').val(),
                                            }
                                            request.post(base_url + '/dismiss')
                                            .type('form')
                                            .send(dismiss)
                                            .then(res => {
                                                // expect
                                                var $html = jQuery(res.text);
                                                var items_sold_text = $html.find('ul.items_sold').text();
                                                var under_negotiation_text = $html.find('ul.under_negotiations').text();
                                                var amount = ad5.price * .1;
                                                var asking_price = ad5.price - amount;
                                                expect(res.redirects[0]).to.have.string("/mytransactions");
                                                expect(under_negotiation_text).to.not.have.string(ad5.name);
                                                expect(under_negotiation_text).to.not.have.string('$'+asking_price);
                                                request.get(base_url + '/dashboard')
                                                .end(function(err, res){
                                                    expect(res.text).to.have.string(ad5.name);
                                                    expect(res.text).to.have.string('$'+ad5.price);
                                                    done();                                                    
                                                });
                                            });
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
                        });
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
    });
});