import json
import traceback

from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db import transaction
from django.http import Http404
from django import http
from django.shortcuts import redirect
from django.views import generic

import reversion

from editor.forms import NewQuestionForm, QuestionForm
from editor.models import NewQuestion, Extension, Resource
import editor.views.generic
import editor.views.editoritem

from accounts.models import UserProfile

class PreviewView(editor.views.editoritem.PreviewView):
    
    """Compile question as a preview and return its URL."""
    
    model = NewQuestion
    
    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
        except (NewQuestion.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),
            }
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except (UserProfile.ObjectDoesNotExist,TypeError):
                pass

            return self.preview(q.editoritem)


class ZipView(editor.views.editoritem.ZipView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = NewQuestion

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
            scorm = 'scorm' in request.GET
        except (NewQuestion.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),
            }
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            try:
                profile = UserProfile.objects.get(user=request.user)
                q.locale = profile.language
            except (UserProfile.ObjectDoesNotExist,TypeError):
                pass

            return self.download(q.editoritem, scorm)


class SourceView(editor.views.editoritem.SourceView):

    """Compile a question as a SCORM package and return the .zip file"""

    model = NewQuestion

    def get(self, request, *args, **kwargs):
        try:
            q = self.get_object()
        except (NewQuestion.DoesNotExist, TypeError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return http.HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            return self.source(q.editoritem)


class CreateView(editor.views.editoritem.CreateView):
    
    """Create a question."""
    
    form_class = NewQuestionForm
    template_name = 'question/new.html'

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            ei = form.save()
            ei.set_licence(ei.project.default_licence)
            ei.save()
            self.question = NewQuestion()
            self.question.editoritem = ei
            self.question.save()

        return redirect(self.get_success_url())
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.question.pk,
                                              self.question.editoritem.slug,))
 
 
class CopyView(editor.views.editoritem.CopyView):

    """ Copy a question """

    model = NewQuestion

class DeleteView(generic.DeleteView):
    
    """Delete a question."""
    
    model = NewQuestion
    template_name = 'question/delete.html'
    
    def do_delete(self):
        self.object.editoritem.delete()
        return http.HttpResponseRedirect(self.get_success_url())

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        if self.object.editoritem.can_be_deleted_by(self.request.user):
            return self.do_delete()
        elif self.request.user.is_superuser:
            if not self.request.POST.get('confirmed'):
                return self.response_class(
                    request=self.request,
                    template='editoritem/superuser_confirm_delete.html',
                    context=self.get_context_data(object=self.object),
                    using=self.template_engine
                )
            else:
                return self.do_delete()
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('editor_index')


class UpdateView(editor.views.editoritem.BaseUpdateView):

    model = NewQuestion
    form_class = QuestionForm
    template_name = 'question/edit.html'
    
    def post(self, request, *args, **kwargs):
        super(UpdateView, self).post(request, *args, **kwargs)

        self.resources = self.data['resources']
        del self.data['resources']
        question_form = QuestionForm(self.data, instance=self.object)

        if question_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
    
    def pre_save(self, form):
        self.object.editoritem.metadata = json.dumps(self.object.editoritem.metadata)
        self.object.extensions.clear()
        self.object.extensions.add(*form.cleaned_data['extensions'])
        self.object.editoritem.subjects.clear()
        self.object.editoritem.subjects.add(*form.cleaned_data['subjects'])
        self.object.editoritem.topics.clear()
        self.object.editoritem.topics.add(*form.cleaned_data['topics'])

        resource_pks = [res['pk'] for res in self.resources]
        self.object.resources = Resource.objects.filter(pk__in=resource_pks)

    
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        extensions = Extension.objects.filter(public=True) | self.object.extensions.all()

        if not self.request.user.is_anonymous():
            extensions |= Extension.objects.filter(author=self.request.user) 

        extensions = extensions.distinct()

        self.item_json['numbasExtensions'] = context['extensions'] = [e.as_json() for e in extensions]

        self.item_json['resources'] = [r.as_json() for r in self.object.resources.all()]

        part_type_path = 'question/part_types/'
        context['partNames'] = [
            (name, '{}/{}.html'.format(part_type_path, name)) 
            for name in 
            ('jme', 'gapfill', 'numberentry', 'patternmatch', '1_n_2', 'm_n_2', 'm_n_x', 'matrix', 'extension')
        ]

        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk, self.object.editoritem.slug))


class RevertView(generic.UpdateView):
    model = NewQuestion
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.question = self.get_object()

        if not self.question.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        return redirect(reverse('question_edit', args=(self.question.pk, self.question.editoritem.slug)))
    
class ShareLinkView(editor.views.generic.ShareLinkView):
    permanent = False
    model = NewQuestion

class StampView(editor.views.generic.StampView):
    model = NewQuestion

class CommentView(editor.views.generic.CommentView):
    model = NewQuestion

    def get_comment_object(self):
        return self.get_object().editoritem

class SetRestorePointView(editor.views.generic.SetRestorePointView):
    model = NewQuestion
