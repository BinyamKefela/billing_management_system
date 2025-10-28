from django.db import migrations
from django.contrib.auth.models import Group

def create_default_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')

    groups = ['Customer', 'Biller']
    for group_name in groups:
        Group.objects.get_or_create(name=group_name)

def delete_default_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['Customer', 'Biller']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('bms', '0001_initial'),
        ('auth', '__latest__'),
    ]

    operations = [
        migrations.RunPython(create_default_groups, delete_default_groups),
    ]
