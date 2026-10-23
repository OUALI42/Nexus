from django.conf import settings
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.core.models import ContentSource, TimeStampedModel


class Quiz(TimeStampedModel):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Facile"
        MEDIUM = "medium", "Moyen"
        HARD = "hard", "Difficile"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes")
    subject = models.ForeignKey(
        "subjects.Subject", on_delete=models.SET_NULL, null=True, blank=True, related_name="quizzes"
    )
    ai_job = models.ForeignKey("ai.AIJob", on_delete=models.SET_NULL, null=True, blank=True, related_name="quizzes")
    title = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    source = models.CharField(max_length=10, choices=ContentSource.choices, default=ContentSource.MANUAL)
    documents = models.ManyToManyField("documents.Document", blank=True, related_name="quizzes")

    class Meta:
        verbose_name = "QCM"
        verbose_name_plural = "QCM"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"], name="quiz_owner_created_idx"),
        ]

    def __str__(self):
        return self.title


class Question(TimeStampedModel):
    class Kind(models.TextChoices):
        SINGLE = "single", "Réponse unique"
        MULTIPLE = "multiple", "Choix multiples"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    position = models.PositiveSmallIntegerField()
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.SINGLE)
    statement = models.TextField()
    explanation = models.TextField(blank=True)

    class Meta:
        ordering = ["quiz", "position"]
        constraints = [
            models.UniqueConstraint(fields=["quiz", "position"], name="uniq_question_quiz_position"),
        ]

    def __str__(self):
        return f"Q{self.position} — {self.statement[:50]}"


class Choice(models.Model):
    # Consistency rules (≥ 2 choices, number of correct answers by kind) span several rows:
    # they are enforced in quizzes/services.py, not in SQL.
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    position = models.PositiveSmallIntegerField()
    label = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["question", "position"]
        constraints = [
            models.UniqueConstraint(fields=["question", "position"], name="uniq_choice_question_position"),
        ]

    def __str__(self):
        return self.label


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts")
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    # Decimal so partial scoring can be added later without a migration
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    max_score = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["user", "finished_at"], name="attempt_user_finished_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(score__gte=0), name="attempt_score_gte_0"),
            models.CheckConstraint(condition=Q(score__lte=F("max_score")), name="attempt_score_lte_max"),
        ]

    def __str__(self):
        return f"{self.user} — {self.quiz} ({self.score}/{self.max_score})"


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="attempt_answers")
    selected_choices = models.ManyToManyField(Choice, blank=True, related_name="attempt_answers")
    # Frozen at submission time: history stays right even if the quiz is edited later
    points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_correct = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["attempt", "question"], name="uniq_answer_attempt_question"),
            models.CheckConstraint(condition=Q(points__gte=0), name="answer_points_gte_0"),
        ]

    def __str__(self):
        return f"{self.attempt_id} / Q{self.question_id}"
