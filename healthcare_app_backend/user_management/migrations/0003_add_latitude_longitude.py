from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0002_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='latitude',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='longitude',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]
