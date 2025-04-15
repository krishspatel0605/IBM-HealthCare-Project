# Generated by Django 4.2.18 on 2025-04-15 06:19

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('hospital', '0002_alter_doctor_hospital'),
    ]

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('doctor_name', models.CharField(max_length=100)),
                ('specialization', models.CharField(max_length=100)),
                ('experience_years', models.IntegerField(default=0)),
                ('mobile_number', models.CharField(max_length=10, validators=[django.core.validators.RegexValidator(code='invalid_mobile', message='Mobile number must be exactly 10 digits.', regex='^\\d{10}$')])),
                ('availability', models.CharField(default='10 AM - 5 PM', max_length=100)),
                ('consultation_fee_inr', models.IntegerField(default=500)),
                ('patients_treated', models.IntegerField(default=0)),
                ('rating', models.FloatField(default=4.0)),
                ('conditions_treated', models.JSONField(blank=True, default=list, help_text='List of conditions or diseases the doctor treats', null=True)),
                ('available_beds', models.IntegerField(default=0)),
                ('address', models.CharField(blank=True, max_length=255, null=True)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('hospital', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='doctor_profiles', to='hospital.hospital_details')),
            ],
            options={
                'db_table': 'doctors',
            },
        ),
    ]
