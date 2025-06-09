# Backend

## Testing
Uses **pytest** for testing, but there are some deprecation warnings that are not relevant to this project. The run_tests.sh script is a wrapper that suppresses these warnings.

To run all tests, instead of using `pytest` use:
```bash
./run_tests.sh
```

To run a specific test, you can pass the name of the test.
```bash
./run_tests.sh "test_name"
```

## Database Migrations

Using **Alembic** for database schema migrations, as is standard.

### Development Workflow

1. **Make model changes** in `models/models.py`
2. **Generate migration** for your changes:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```
3. **Review the generated migration** in `alembic/versions/`
4. **Run the migration**:
   ```bash
   alembic upgrade head
   ```

### Other Helpful Commands

Check current version
```bash
alembic current
```

Rollback one migration
```bash
alembic downgrade -1
```

View history
```bash
alembic history --verbose
```

## Sample Data Generation

For development and demo purposes, you can generate sample tasks and AI-powered summaries.

```bash
python scripts/seed_data.py
```

or
```bash
curl -X POST http://localhost:8000/api/tasks/generate-sample-data
```

This will:
- Clear all existing tasks and summaries
- Generate many days of sample tasks (working backwards from today)
- Generate AI-powered weekly summaries for all weeks that have tasks

**Note:** Requires `OPENAI_API_KEY` environment variable to be set for AI summary generation.
