from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^dashboard$', views.dashboard),

    url(r'^logout$', views.logout),

    url(r'^reset$', views.reset),
]