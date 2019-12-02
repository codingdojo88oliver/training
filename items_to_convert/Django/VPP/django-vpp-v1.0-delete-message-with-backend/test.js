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

var userc = {
    email: "steven@datacompass.com",
    password: "password"
}

var plane_id;

describe('(1 pt) Landed and created planes\' message should be accessible via this url: /planes/<id>', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });
    this.timeout(15000);
    it('Landed and created planes\' message should be accessible via this url: /planes/<id>', function(done){
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

describe('(1 pt) It should remove the plane from My Planes table on a successful delete paper plane process and should notify the logged in user with: "Plane successfully deleted" message in dashboard', function(){
    this.timeout(15000);
    it('It should remove the plane from My Planes table on a successful delete paper plane process and should notify the logged in user with: "Plane successfully deleted" message in dashboard', function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            usera.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(usera)
            .then(res => {
                var $html = jQuery(res.text);
                plane_id = $html.find("input.delete_plane_id").val();
                var plane = {
                    plane_id: plane_id
                };                
                plane.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/delete-plane')
                .type('form')
                .send(plane)
                .then(res => {
                    var $html = jQuery(res.text);
                    expect($html.find('#my-planes tbody').length).to.equal(0);
                    let redirect_url = res != undefined ? res.redirects[0] : "";
                    expect(redirect_url).to.have.string("/dashboard");
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
        });
    });    
})

describe('(1 pt) It should also remove the plane from "Virtual planes landed in your location" table on a successful delete paper plane process, given that the plane landed but was later deleted.', function(){
    this.timeout(15000);
    it("It should also remove the plane from 'Virtual planes landed in your location' table on a successful delete paper plane process, given that the plane landed but was later deleted.", function(done){
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
                    userc.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/login')
                    .type('form')
                    .send(userc)
                    .then(res => {
                        var $html = jQuery(res.text);
                        expect($html.find('#messages-received tbody').length).to.equal(0);
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                });
            })
            .catch(err =>{
                return done(err);
            });
        });
    });    
});

describe('(1 pt) It should display an error when you attempt to view/visit the plane you just recently deleted.', function(){
    this.timeout(15000);
    it("It should display an error when you attempt to view/visit the plane you just recently deleted.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            usera.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(usera)
            .then(res => {
                request.get(base_url + '/planes/' + plane_id)
                .end(function(err, res){
                    expect(res.text).to.have.string("You are not allowed to view this message");
                    done();
                }); 
            })
            .catch(err =>{
                return done(err);
            })
        });            
    });
});

