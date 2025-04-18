# Generated by Django 4.1.13 on 2025-02-28 10:37

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Hospital",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                ("specialization", models.CharField(max_length=200)),
                ("location", models.CharField(max_length=200)),
                ("available_beds", models.IntegerField()),
                ("diseases_treated", models.JSONField(default=list)),
            ],
        ),
        migrations.CreateModel(
            name="Hospital_Details",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                ("specialization", models.CharField(max_length=200)),
                ("location", models.CharField(max_length=200)),
                ("available_beds", models.IntegerField()),
                ("diseases_treated", models.JSONField(default=list)),
            ],
        ),
        migrations.CreateModel(
            name="Doctor",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("specialization", models.CharField(max_length=100)),
                ("experience", models.IntegerField(default=0)),
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
                (
                    "hospital",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="doctors",
                        to="hospital.hospital_details",
                    ),
                ),
            ],
        ),
    ]
