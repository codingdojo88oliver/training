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
    name: "D'Squarius Green, Jr.",
    email: "dsquarius@greenjr.com",
    password: "password",
    c_password: "password",
    country: "",
    interests: "",
    language: "",
};

// second test user inserted in db
var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",
    country: "Taiwan",
    interests: "sports",
    language: "english",    
};

// third test user inserted in db
// first to login (when testing the login feature)
// first to create plane with message: A secret test message 1
// second message: A secret message 2
// third message: A secret message 3
var user2a = {
    name: "Ozamataz Buckshank",
    email: "ozamataz@buckshank.com",
    password: "password",
    c_password: "password",
    country: "United States",
    interests: "memes",
    language: "english",
};

// expected to not be inserted in db
var user3 = {
    name: "KB",
    email: "djasperprobincrux@thethird.com",
    password: "six",
    c_password: "sixty",
    interests: "sports",
    language: "english", 
};

// expected to not be inserted in db
var user4 = {
    name: "Leoz Maxwell Jilliumz",
    email: "leozmax@jilliumz.com",
    password: "password",
    c_password: "password",
    country: "United States"
};

// is just user2a login creds
var user5 = {
    email: "ozamataz@buckshank.com",
    password: "password"
};

// an invalid email password combination
var user6 = {
    email: "javarisjamarjavarison@lamar.com",
    password: "password1"
};

// fourth test user inserted in db
var user7 = {
    name: "Bismo Funyuns",
    email: "bismo@funyuns.com",
    password: "password",
    c_password: "password",
    country: "Japan",
    interests: "Crochet",
    language: "english",
};

// fifth test user inserted in db
// is a match to user2a
var user8 = {
    name: "Scoish Velociraptor Maloish",
    email: "scoishvelociraptor@maloish.com",
    password: "password",
    c_password: "password",
    country: "Taiwan",
    interests: "memes",
    language: "english",
};

var user8a = {
    email: "scoishvelociraptor@maloish.com",
    password: "password",    
}

var plane1 = {
    message: "test message",
    user_id: 100000,
};

var message1 = {
    plane_id: 100000,
}

describe('(4 pts) Create the user registration feature', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    this.timeout(15000);
    it("should redirect user back to / page upon successful registration", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                expect(res.redirects[0]).to.have.string("/")
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    it("should greet the user (include name and email) on successful registration.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2a)
            .then(res => {
                expect(res.text).to.have.string(user2a.name);
                expect(res.text).to.have.string(user2a.email);
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    // all validation errors
    it("Name should be at least 3 characters, Password should be at least 6 characters, Country is required, and Password and Confirm Password must match validations", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {
                expect(res.text).to.have.string("Name should be at least 3 characters");
                expect(res.text).to.have.string("Password should be at least 6 characters");
                expect(res.text).to.have.string("Passwords do not match");
                expect(res.text).to.have.string("Country is required");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })

    it("should require at least 1 language and 1 interest", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user4.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user4)
            .then(res => {
                expect(res.text).to.have.string("Should select at least 1 interest");
                expect(res.text).to.have.string("Should select at least 1 language");
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
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            expect(res.redirects[0]).to.have.string("/")
            done();
        })
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

// // current logged in user while testing here is user5
describe('(5 pts) Implement the Create Virtual Plane feature', function(){
    this.timeout(15000);
    it("should require the message & message should be at least 6 characters", function(done) {
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
    it("message should be at least 6 characters", function(done) {
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
    it("should redirect user back to /dashboard page upon successful virtual paper plane creation", function(done){
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
                expect(res.redirects[0]).to.have.string("/dashboard");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })
    it("should notify the user that a virtual paper plane has been successfully created.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            var plane = {
                message: "A secret message 2"
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
    })
    it("Virtual Plane status should have a default value of 'Ready' displayed in /dashboard", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);
            var plane = {
                message: "A secret message 3"
            };            
            plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/create-plane')
            .type('form')
            .send(plane)
            .then(res => {
                expect(res.text).to.have.string("Ready");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })   
})

describe('(2 pts) Show Virtual Plane feature', function(){
    this.timeout(15000);
 
    // currently logged in is user5 or user2a
    // "A secret message 1" is user5's first message
    it("logged in user should be able to see his/her own virtual plane", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
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
    it("logged in user should not be allowed to see other user's virtual paper planes", function(done){
        request.get(base_url + '/my-planes/10000')
        .end(function(err, res){
            expect(res.text).to.have.string("You are not allowed to view this message");
            done();
        })
    })
});

describe('(5 pts) Implement the Throw Virtual Plane feature', function(){
    this.timeout(15000);
    // currently logged in is user5 or user2a
    // "A secret message 1" is user5's first message
    it("Logged in user that has no match yet, shouldn't be able to land his/her plane. Status should still be set to 'Ready' and should display a notification message: No matching users found.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var plane_id = $html.find("input.throw_plane_id").val();
                var plane = {
                    plane_id: plane_id
                };            
                plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/throw-plane')
                .type('form')
                .send(plane)
                .then(res => {
                    expect(res.text).to.have.string("Ready");
                    expect(res.text).to.have.string("No matching users found");
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
    })
    it("should only match if user has at least 1 interest and 1 language in common with the current logged in user", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);    
            user7.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user7)
            .then(res => {
                var $html = jQuery(res.text);
                user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user5)
                .then(res => {
                    var $html = jQuery(res.text);
                    var plane_id = $html.find("input.throw_plane_id").val();
                    var plane = {
                        plane_id: plane_id
                    };
                    plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/throw-plane')
                    .type('form')
                    .send(plane)
                    .then(res => {
                        expect(res.text).to.have.string("Ready");
                        expect(res.text).to.have.string("No matching users found");
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
    });
    it("set the status to 'Landed' and should notify the logged in user: Congratulations! Your plane flew and landed!", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);
            user8.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user8)
            .then(res => {
                var $html = jQuery(res.text);
                user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user5)
                .then(res => {
                    var $html = jQuery(res.text);
                    var plane_id = $html.find("input.throw_plane_id").val();
                    var plane = {
                        plane_id: plane_id
                    };
                    plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/throw-plane')
                    .type('form')
                    .send(plane)
                    .then(res => {
                        expect(res.text).to.have.string("Landed");
                        expect(res.text).to.have.string("Congratulations! Your plane flew and landed!");
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
    })
    it("The matching user who received the secret message should be able to view the received message in dashboard with default status 'Unread' with corresponding Country of Origin", function(done){
        request.get(base_url + '/logout')
        .end(function(err, res){

        })
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
    
            user8a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user8a)
            .then(res => {
                expect(res.text).to.have.string("Unread");
                expect(res.text).to.have.string("United States");
                done();          
            })
            .catch(err =>{
                return done(err);
            })
        })
    });

    it("Throwing the same virtual paper plane should not land on the user who already received the plane", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);       
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var plane_id = $html.find("input.throw_plane_id").val();
                var plane = {
                    plane_id: plane_id
                };          
                plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/throw-plane')
                .type('form')
                .send(plane)
                .then(res => {
                    expect(res.text).to.have.string("No matching users found");
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
    })
});

describe('(2 pts) Implement the Stamp feature', function() {
    this.timeout(15000);
    it("The matching user who received the secret message should be able to read the message in received-planes/id, should stamp the plane with logged in user's country, and should set Unread to Read in dashboard", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            var user = {
                email: "scoishvelociraptor@maloish.com",
                password: "password",
            };        
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.received-plane").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    expect(res.text).to.have.string("A secret test message 1");
                    expect(res.text).to.have.string("Taiwan");
                    expect(res.text).to.have.string("United States");
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        expect(res.text).to.have.string("Read");
                        done();
                    });
                });              
            })
            .catch(err =>{
                return done(err);
            })
        })        
    });
    it("should stamp the message only ONCE for current logged in user", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);
            var href = $html.find("a.received-plane").attr('href');
            request.get(base_url + href)
            .end(function(err, res){
                expect(res.text).to.have.string("A secret test message 1");
                expect(res.text).to.not.have.string("Taiwan, Taiwan");
                expect(res.text).to.have.string("United States");
                done();
            });

        });
    });    
})

describe('(2 pts) Implement the Delete Virtual Paper Plane feature', function(){
    this.timeout(15000);
    it("logged in user should be able to delete own virtual paper plane and should redirect back to dashboard with a success message", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);       
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var plane_id = $html.find("input.delete_plane_id").val();
                var plane = {
                    plane_id: plane_id
                };                
                plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/delete-plane')
                .type('form')
                .send(plane)
                .then(res => {
                    expect(res.redirects[0]).to.have.string("/dashboard")
                    expect(res.text).to.have.string("Plane successfully deleted");
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
    })
    it("logged in user is not allowed to delete other user's virtual paper planes", function(done){
        request.get(base_url + '/dashboard')
        .end(function(err, res){
            var $html = jQuery(res.text);
            var plane = {
                plane_id: 10000000000
            };            
            plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/delete-plane')
            .type('form')
            .send(plane)
            .then(res => {
                expect(res.text).to.have.string("You are not allowed to delete this virtual paper plane");
                done();
            })
            .catch(err =>{
                return done(err);
            })
        })
    })  
});
