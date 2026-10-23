from .models import AIJob

# Credits consumed by each job kind (ADR-008). Failed jobs are not counted.
JOB_COSTS = {
    AIJob.Kind.CHAT_ANSWER: 1,
    AIJob.Kind.SHEET_GENERATION: 5,
    AIJob.Kind.QUIZ_GENERATION: 5,
    AIJob.Kind.DOCUMENT_INGESTION: 0,
}
