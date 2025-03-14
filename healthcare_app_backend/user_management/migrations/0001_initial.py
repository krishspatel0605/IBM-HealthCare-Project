# Generated by Django 4.2.19 on 2025-03-05 05:38

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="HealthcareUser",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("first_name", models.CharField(max_length=255)),
                ("last_name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254, unique=True)),
                (
                    "mobile_number",
                    models.CharField(
                        max_length=10,
                        validators=[
                            django.core.validators.RegexValidator(
                                code="invalid_mobile",
                                message="Mobile number must be exactly 10 digits.",
                                regex="^\\d{10}$",
                            )
                        ],
                    ),
                ),
                ("password", models.CharField(max_length=255)),
                (
                    "role",
                    models.CharField(
                        choices=[("patient", "Patient"), ("doctor", "Doctor")],
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
