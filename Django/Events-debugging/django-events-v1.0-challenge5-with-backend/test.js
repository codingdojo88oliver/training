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
    name: "Brian Stronk",
    email: "brian@datacompass.com",
    password: "password",
    c_password: "password"
}

var user1a = {
    email: "brian@datacompass.com",
    password: "password"
}

var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};

// is just user2 login creds
var user2a = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

var event = {
    name: "Albert Einstein",
    date: "2019-12-1",
    location: "Philippines",
    description: "lorem ipsum something something",
    max_attendees: 2,
}

describe('(1 pt) When the user successfully clicks the ‘Join’ button, the user is redirected back to the Dashboard page.', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })

        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user1.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user1)
            .then(res => {
                // done();
            })
            .catch(err =>{
                return done(err);
            })
        });
    });    
    it("When the user successfully clicks the ‘Join’ button, the user is redirected back to the Dashboard page.", function(done){
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
                        request.get(base_url + '/host-event')
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            event.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            request.post(base_url + '/create-event')
                            .type('form')
                            .send(event)
                            .then(res => {
                                var $html = jQuery(res.text);
                                user1a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                request.post(base_url + '/login')
                                .type('form')
                                .send(user1a)
                                .then(res => {
                                    var $html = jQuery(res.text);
                                    var join = {};
                                    var event_id = $html.find("input.event_id").val();
                                    join.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                    join.event_id = event_id;
                                    request.post(base_url + '/join-event')
                                    .type('form')
                                    .send(join)
                                    .then(res => {
                                        let redirect_url = res != undefined ? res.redirects[0] : "";
                                        expect(redirect_url).to.have.string("/dashboard");
                                        done();
                                    })
                                    .catch(err =>{
                                        return done(err);
                                    })
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
                    })
                })
            })
            .catch(err =>{
                return done(err);
            })
        });                 
    });
});

describe('(1 pt) When the user successfully clicks the ‘Join’ button, the clicked event should now reflect on the ‘Events Im Joining section’', function(){
    this.timeout(15000);
    it("When the user successfully clicks the ‘Join’ button, the clicked event should now reflect on the ‘Events Im Joining section’", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user1a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user1a)
            .then(res => {
                let redirect_url = res != undefined ? res.redirects[0] : "";
                expect(redirect_url).to.have.string("/dashboard");
                var $html = jQuery(res.text);
                var upcoming_events = $html.find("table#upcoming_events").text();
                var events_im_joining = $html.find("table#events_im_joining").text();
                expect(upcoming_events).to.not.have.string(event.name);
                expect(events_im_joining).to.have.string(event.name);
                done();                       
            })
            .catch(err =>{
                return done(err);
            })
        });                 
    });
});
