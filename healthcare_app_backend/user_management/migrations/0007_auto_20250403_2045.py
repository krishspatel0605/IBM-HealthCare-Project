# Generated by Django 3.2 on 2025-04-03 15:15

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0006_user_email_otp'),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivationToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('otp', models.CharField(max_length=6)),
                ('token', models.CharField(max_length=100, unique=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.AddIndex(
            model_name='activationtoken',
            index=models.Index(fields=['email'], name='user_manage_email_2cd815_idx'),
        ),
    ]
