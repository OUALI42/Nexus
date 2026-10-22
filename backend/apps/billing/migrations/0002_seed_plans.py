from django.db import migrations

MB = 1024**2
GB = 1024**3

# Initial values from ADR-008 (provisional)
PLANS = [
    {"code": "basic", "name": "Basique", "monthly_price_cents": 0,
     "storage_quota_bytes": 500 * MB, "max_file_size_bytes": 10 * MB, "monthly_ai_credits": 30},
    {"code": "intermediate", "name": "Intermédiaire", "monthly_price_cents": 499,
     "storage_quota_bytes": 5 * GB, "max_file_size_bytes": 25 * MB, "monthly_ai_credits": 300},
    {"code": "premium", "name": "Premium", "monthly_price_cents": 999,
     "storage_quota_bytes": 20 * GB, "max_file_size_bytes": 50 * MB, "monthly_ai_credits": 1500},
]


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    for data in PLANS:
        Plan.objects.update_or_create(code=data["code"], defaults=data)


def backfill_subscriptions(apps, schema_editor):
    """Users created before this migration (e.g. your superuser) get the basic plan."""
    User = apps.get_model("accounts", "User")
    Plan = apps.get_model("billing", "Plan")
    Subscription = apps.get_model("billing", "Subscription")
    basic = Plan.objects.get(code="basic")
    for user in User.objects.filter(subscription__isnull=True):
        Subscription.objects.create(user=user, plan=basic)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, migrations.RunPython.noop),
        migrations.RunPython(backfill_subscriptions, migrations.RunPython.noop),
    ]