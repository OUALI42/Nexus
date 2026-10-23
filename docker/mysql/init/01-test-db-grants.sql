#!/bin/sh
# Grants the app user access to the test database created by pytest-django.
set -e
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
GRANT ALL PRIVILEGES ON \`test_${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL