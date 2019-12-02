from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^login$', views.login),

    url(r'^dashboard$', views.dashboard),

    url(r'^logout$', views.logout),

    url(r'^create-plane$', views.createPlane),

    url(r'^planes/(?P<id>\d+)', views.showMyPlane),

    url(r'^reset$', views.reset),
]