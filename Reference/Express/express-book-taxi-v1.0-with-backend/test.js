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

var user = {
    name: "Oliver",
    username: "oliver",
    password: "password",
    designation: "driver"
}

var usera = {
    username: "oliver",
    password: "password",
    state: "colorado",
}

var blank_user = {
    name: "",
    username: "",
    password: "",
    designation: ""    
}

var commuter = {
    name: "Pamela",
    username: "pamela",
    password: "password",
    designation: "commuter",
}

var commuter2 = {
    name: "Mike",
    username: "mike",
    password: "password",
    designation: "commuter",
}

var commutera = {
    username: "pamela",
    password: "password",
    state: "colorado",
}

var commuterb = {
    username: "mike",
    password: "password",
    state: "seattle",
}

var invalid_uname_and_password = {
    username: "invalid",
    password: "invalid",
    state: "colorado",
}

var book = {
    pick_up: "SAN JUAN",
    drop_off: "SAN FERNANDO",
    state: "colorado",
}

var accept_book = {
    book_status: 2,
}

var book_update = {
    is_drop_off: 2,
}

var driver_rating = {
    rating_star: 4,
    comment: "A great driver!"
}

describe('(3 pts) Implement the Registration feature', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })
        request.get(base_url + '/reset')
        .end(function(err, res){

        });
    });     

    it("Should be able to register a new user with 'driver' as designation type. Display the success notification message.", function(done){
        request.post(base_url + "/register")
        .type('form')
        .send(user)
        .then(res => {
            expect(res.text).to.have.string("User Successfully registered!");
            done();
        })
        .catch(err =>{
            return done(err);
        })
    });

    it("It should not allow blank name, username, and password", function(done){
        request.post(base_url + "/register")
        .type('form')
        .send(blank_user)
        .then(res => {
            expect(res.text).to.have.string("Name should not be blank");
            expect(res.text).to.have.string("Username should not be blank");
            expect(res.text).to.have.string("Password should not be blank");
            done();
        })
        .catch(err =>{
            return done(err);
        })
    });

    it("Username should be unique. Error message: Username is already in use!", function(done){
        request.post(base_url + "/register")
        .type('form')
        .send(user)
        .then(res => {
            expect(res.text).to.have.string("Username is already in use!");
            done();
        })
        .catch(err =>{
            return done(err);
        })
    });
});

describe("(3 pts) Implement the Login feature", function(){
    this.timeout(15000);
    // register a commuter
    before(function() {
        request.post(base_url + "/register")
        .type('form')
        .send(commuter)
        .then(res => {

        })
        .catch(err =>{
            return err;
        })
    });
    it("Should redirect driver to /driver_dashboard on a successful login", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(usera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/driver_dashboard");
            expect(res.text).to.have.string(user.name);
            done();
        })
        .catch(err =>{
            return done(err);
        })
    })

    it("Should redirect driver to /commuter_dashboard on a successful login", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/commuter_dashboard");
            expect(res.text).to.have.string(commuter.name);
            done();
        })
        .catch(err =>{
            return done(err);
        })
    })

    it("Should not allow an invalid username and password", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(invalid_uname_and_password)
        .then(res => {
            expect(res.text).to.have.string("Invalid Username or Password!");
            done();
        })
        .catch(err =>{
            return done(err);
        })        
    })
});

describe("(2 pts) Implement the Commuter Dashboard page.", function(){
    this.timeout(15000); 
    it("Commuter should be able to see drivers that are from the same state", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/commuter_dashboard");
            expect(res.text).to.have.string(user.name);
            done();
        })
        .catch(err =>{
            return done(err);
        })
    })
    it("Commuter should be to click on a driver and be redirected to driver's profile", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            var $html = jQuery(res.text);
            var driver = jQuery($html.find("a.driver"));
            request.get(base_url + driver.attr('href'))
            .then(res => {
                expect(res.text).to.have.string(user.name);
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
});

describe("(3 pts) Implement the Booking feature.", function(){
    this.timeout(15000);
    // register a commuter from seattle
    before(function() {
        request.post(base_url + "/register")
        .type('form')
        .send(commuter2)
        .then(res => {

        })
        .catch(err =>{
            return err;
        })
    });  
    it("Commuter should be able to book driver", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            var $html = jQuery(res.text);
            var driver_id = jQuery($html.find("input.driver_id")).val();
            book.driver_id = driver_id;
            request.post(base_url + "/book")
            .type('form')
            .send(book)
            .then(res => {
                var $html = jQuery(res.text);
                var my_booking = jQuery($html.find(".my_booking"));
                expect(res.redirects[0]).to.have.string("/commuter_dashboard");
                expect(my_booking.text()).to.have.string("My Booking:");
                expect(my_booking.text()).to.have.string("SAN FERNANDO");
                done();
            })
            .catch(err => {
                return done(err);
            })
        })
        .catch(err =>{
            return done(err);
        })
    })

    it("Commuter should not be able to see driver from different state", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commuterb)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/commuter_dashboard");
            expect(res.text).to.not.have.string(user.name);
            done(); 
        })
        .catch(err =>{
            return done(err);
        })
    })

    it("It should show the driver with the same location when the commuter updates his/her location", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commuterb)
        .then(res => {
            request.post(base_url + "/update_location")
            .type('form')
            .send({state: "colorado"})
            .then(res => {
                expect(res.redirects[0]).to.have.string("/commuter_dashboard");
                expect(res.text).to.have.string(user.name);
                done();
            })
            .catch(err => {
                return done(err);
            })
        })
        .catch(err =>{
            return done(err);
        })
    });
});

describe("(5 pts) Implement the Driver Dashboard", function(){
    this.timeout(15000);
    after(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })
    });     
    it("Should show which commuter booked the driver and should show pick up location", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(usera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/driver_dashboard");
            expect(res.text).to.have.string(commuter.name);
            expect(res.text).to.have.string(book.pick_up);
            done();
        })
        .catch(err =>{
            return done(err);
        })        
    })

    it("Should not be able to see other commuters from different state", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(usera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/driver_dashboard");
            expect(res.text).to.not.have.string(commuter2.name);
            done();
        })
        .catch(err =>{
            return done(err);
        })        
    })

    it("Should be able to accept a booking", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(usera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/driver_dashboard");
            var $html = jQuery(res.text);
            var book_id = jQuery($html.find("input.book_id")).val();
            accept_book.book_id = book_id;
            request.post(base_url + "/update_book_status")
            .type('form')
            .send(accept_book)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/driver_dashboard");
                expect(res.text).to.have.string("Accepted");
                expect(res.text).to.have.string(book.pick_up);
                expect(res.text).to.have.string(book.drop_off);
                done();
            })
            .catch(err => {
                return done(err);
            })
        })
        .catch(err =>{
            return done(err);
        })
    });

    it("Accepted bookings should reflect on commuter's dashboard", function(done){
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/commuter_dashboard");
            expect(res.text).to.have.string("accepted");
            expect(res.text).to.have.string(user.name);
            done();
        })
        .catch(err =>{
            return done(err);
        })
    });

    it("Driver should be able to update booking status", function(done){
        //  and commuter should be able to see the update - MISSING feature
        request.post(base_url + "/login")
        .type('form')
        .send(usera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/driver_dashboard");
            var $html = jQuery(res.text);
            var book_id = jQuery($html.find("input.book_id")).val();
            book_update.book_id = book_id;
            request.post(base_url + "/drop_off")
            .type('form')
            .send(book_update)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/driver_dashboard");
                expect(res.text).to.not.have.string(commuter.name);
                expect(res.text).to.not.have.string(book.pick_up);
                expect(res.text).to.not.have.string(book.drop_off);
                done();
            })
            .catch(err => {
                return done(err);
            })
        })
        .catch(err =>{
            return done(err);
        })
    });
})

describe("(1 pt) Implement the Ratings feature", function(){
    this.timeout(15000);
    it("Commuter should be able to rate the driver", function(done){
        //  and commuter should be able to see the update - MISSING feature
        request.post(base_url + "/login")
        .type('form')
        .send(commutera)
        .then(res => {
            expect(res.redirects[0]).to.have.string("/commuter_dashboard");
            var $html = jQuery(res.text);
            var driver_id = jQuery($html.find("input.driver_id")).val();
            driver_rating.driver_id = driver_id;
            request.post(base_url + "/driver_rating")
            .type('form')
            .send(driver_rating)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/commuter_dashboard");
                // count the form.driver_rating p
                var $html = jQuery(res.text);
                var rating = jQuery($html.find("i.fas")).length;
                console.log(rating)
                expect(rating).to.equal(4);



                var driver = jQuery($html.find("a.driver"));
                request.get(base_url + driver.attr('href'))
                .then(res => {
                    expect(res.text).to.have.string(user.name);
                    expect(res.text).to.have.string(driver_rating.comment);
                    done();
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err => {
                return done(err);
            })
        })
        .catch(err =>{
            return done(err);
        })
    });  
})

describe('(1 pt) Implement the Logout feature', function(){
    this.timeout(15000);
    after(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })
    });
    it("should be able to clear session on logout", function(done){
        //make sure user1's info is in session
        request.get(base_url + "/check_session")
        .then(res => {
            expect(res.status).to.equal(200)
            expect(res.text).to.have.string(commuter.name)
            expect(res.text).to.not.have.string(commuter2.name)
            //logout
            request.get(base_url + "/logout")
            .then(res => {
                expect(res.status).to.equal(200)
                //make sure no user's information is in session
                request.get(base_url + "/check_session")
                .then(res => {
                    expect(res.status).to.equal(200)
                    expect(res.text).to.not.have.string(commuter.name)
                    expect(res.text).to.not.have.string(commuter2.name)
                    done()
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
    });
})