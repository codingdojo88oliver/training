from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^login$', views.login),

    url(r'^dashboard$', views.dashboard),

    url(r'^host-event$', views.hostEvent),

    url(r'^create-event$', views.createEvent),

    url(r'^join-event$', views.joinEvent),

    url(r'^unjoin-event$', views.unjoinEvent),

    url(r'^logout$', views.logout),

    url(r'^reset$', views.reset),
]