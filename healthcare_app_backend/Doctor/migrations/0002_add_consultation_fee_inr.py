from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('Doctor', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='consultation_fee_inr',
            field=models.IntegerField(default=500),
        ),
    ]
