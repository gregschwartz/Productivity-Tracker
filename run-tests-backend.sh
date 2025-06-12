#! /bin/bash
docker-compose exec backend pytest --disable-warnings --disable-pytest-warnings --failed-first --no-header --quiet 