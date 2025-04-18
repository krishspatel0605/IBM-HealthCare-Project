# Generated by Django 3.2 on 2025-04-07 10:37

from django.db import migrations, models
import djongo.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0009_auto_20250405_1620'),
    ]

    operations = [
        migrations.AddField(
            model_name='activationtoken',
            name='user_data',
            field=djongo.models.fields.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name='user',
            name='otp_expiry',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
