import pytest
from django.urls import reverse

from apps.subjects.models import Subject

pytestmark = pytest.mark.django_db


@pytest.fixture
def other_user(django_user_model):
    return django_user_model.objects.create_user(
        email="grace@example.com", password="Str0ng-password!"
    )


@pytest.fixture
def logged_client(api_client, verified_user):
    api_client.force_login(verified_user)
    return api_client


def list_url():
    return reverse("lockers:list")


def payload(**overrides):
    return {"name": "Philosophie", "color": "#4338ca", "icon": "book-open", **overrides}


def test_an_anonymous_visitor_cannot_list_lockers(api_client):
    response = api_client.get(list_url())

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "not_authenticated"


def test_a_student_only_sees_their_own_lockers_in_order(
    logged_client, verified_user, other_user
):
    Subject.objects.create(
        owner=verified_user, name="Physique", color="#0e7490", position=1
    )
    Subject.objects.create(
        owner=verified_user, name="Maths", color="#4338ca", position=0
    )
    Subject.objects.create(owner=other_user, name="Secret", color="#6d28d9", position=0)

    response = logged_client.get(list_url())

    assert response.status_code == 200
    assert [locker["name"] for locker in response.json()] == ["Maths", "Physique"]
    assert response.json()[0]["course_count"] == 0


def test_a_student_creates_a_locker_at_the_end_of_the_list(
    logged_client, csrf_post, verified_user
):
    Subject.objects.create(
        owner=verified_user, name="Maths", color="#4338ca", position=0
    )

    response = csrf_post(list_url(), payload())

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Philosophie"
    assert body["icon"] == "book-open"
    assert body["position"] == 1
    assert body["course_count"] == 0
    assert Subject.objects.get(pk=body["id"]).owner == verified_user


def test_the_owner_cannot_be_chosen_in_the_payload(
    logged_client, csrf_post, verified_user, other_user
):
    response = csrf_post(list_url(), payload(owner=other_user.pk))

    assert response.status_code == 201
    assert Subject.objects.get(pk=response.json()["id"]).owner == verified_user


def test_a_locker_name_is_unique_whatever_the_case(
    logged_client, csrf_post, verified_user
):
    Subject.objects.create(owner=verified_user, name="Philosophie", color="#4338ca")

    response = csrf_post(list_url(), payload(name="  philosophie "))

    assert response.status_code == 400
    assert "name" in response.json()["error"]["details"]


def test_another_students_locker_name_is_still_available(
    logged_client, csrf_post, other_user
):
    Subject.objects.create(owner=other_user, name="Philosophie", color="#4338ca")

    response = csrf_post(list_url(), payload())

    assert response.status_code == 201


@pytest.mark.parametrize(
    ("field", "value"),
    [("icon", "skull"), ("color", "#ffff00"), ("color", "red"), ("name", "")],
)
def test_invalid_values_are_rejected(logged_client, csrf_post, field, value):
    response = csrf_post(list_url(), payload(**{field: value}))

    assert response.status_code == 400
    assert field in response.json()["error"]["details"]


def test_creating_a_locker_requires_the_csrf_token(logged_client):
    response = logged_client.post(list_url(), payload(), format="json")

    assert response.status_code == 403


def test_a_student_cannot_open_another_students_locker(logged_client, other_user):
    locker = Subject.objects.create(owner=other_user, name="Secret", color="#6d28d9")

    response = logged_client.get(reverse("lockers:detail", args=[locker.pk]))

    assert response.status_code == 404


def test_the_choices_list_colors_and_icons_with_labels(logged_client):
    response = logged_client.get(reverse("lockers:choices"))

    assert response.status_code == 200
    body = response.json()
    assert {"value": "#4338ca", "label": "Indigo"} in body["colors"]
    assert {"value": "folder", "label": "Dossier"} in body["icons"]
