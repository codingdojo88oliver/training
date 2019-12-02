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
    name: "Brian",
    email: "brian@datacompass.com",
    password: "password",
    c_password: "password",
    country: "United States",
}

var user2 = {
    name: "Elly",
    email: "elly@datacompass.com",
    password: "password",
    c_password: "password",
    country: "UK"
}

var user3 = {
    name: "Steven",
    email: "steven@datacompass.com",
    password: "password",
    c_password: "password",
    country: "United States",

}

var usera = {
    email: "brian@datacompass.com",
    password: "password"
}

// user from diff country
var userb = {
    email: "brian@datacompass.com",
    password: "password",
}

var userc = {
    email: "steven@datacompass.com",
    password: "password"
}

describe('(1 pt) It should say "No matching users found" if you attempt to throw a plane and there are no other users yet.', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });
    this.timeout(15000);
    it('It should say "No matching users found" if you attempt to throw a plane and there are no other users yet.', function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user)
            .then(res => {
                var $html = jQuery(res.text);
                usera.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(usera)
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

describe('(1 pt) It should also say "No matching users found" if you attempt to throw a plane, but the other user is from a different country', function(){
    this.timeout(15000);
    it('It should say "No matching users found" if you attempt to throw a plane and there are no other users yet.', function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                var $html = jQuery(res.text);
                usera.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(usera)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
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
})

describe('(1 pt) It should say "Congratulations! Your plane flew and landed!" if it successfully found a match. The plane status should be updated from "Ready" to "Landed"', function(){
    this.timeout(15000);
    it("set the status to 'Landed' and should notify the logged in user: Congratulations! Your plane flew and landed!", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {
                var $html = jQuery(res.text);
                user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user)
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
});

describe('(1 pt) The "Throw Plane" button should be removed if the plane status is already set to "Landed"', function(){
    this.timeout(15000);
    it("The corresponding 'Throw Plane' button should be removed if the plane status is already set to 'Landed'", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user)
            .then(res => {
                expect(res.text).to.not.have.string("throw_plane_id");
                done();
            })
            .catch(err =>{
                return done(err);
            })            
        });
    })
});

describe('(1 pt) When the matching user who received the plane logs in, he/she should be able to see the plane listed under "Virtual planes landed in your location" table in his/her dashboard', function(){
    this.timeout(15000);
    it("should list the received message in the other user's dashboard", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            userc.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(userc)
            .then(res => {
                request.get(base_url + '/dashboard')
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    expect($html.find('#messages-received tbody').length).to.equal(1);
                    expect($html.find('#messages-received').text()).to.not.have.string("06:42:08 Aug 08, 2019");
                    done();
                })
            })
            .catch(err =>{
                return done(err);
            })
        });
    });
});

describe('(1 pt) The matching user who received the virtual paper plane should be able to read the secret message in /planes/<id>.', function(){
    this.timeout(15000);
    it("The matching user who received the virtual paper plane should be able to read the secret message in /planes/<id>.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);      
            userc.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(userc)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.received-plane").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    expect(res.text).to.have.string("A secret test message 1");
                    expect(res.text).to.have.string("United States");
                    done();
                });              
            })
            .catch(err =>{
                return done(err);
            })
        })        
    });    
});

