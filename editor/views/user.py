﻿import json
from django.contrib.auth.models import User
from django.views.generic import ListView
from django.http import Http404, HttpResponse
from django.urls import reverse

from accounts.util import find_users
from editor.views import request_is_ajax

class UserSearchView(ListView):
    
    """Search users."""
    
    model = User
    
    def render_to_response(self, context, **response_kwargs):
        if request_is_ajax(self.request):
            return HttpResponse(json.dumps(context['object_list']),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        try:
            search_term = self.request.GET['q']
            users = find_users(name=search_term)
        except KeyError:
            users = User.objects.all()
        return [{"name": u.get_full_name(), "id": u.id, "profile": reverse('view_profile', args=(u.pk,))} for u in users]
