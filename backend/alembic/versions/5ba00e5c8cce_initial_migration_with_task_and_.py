"""Initial migration with Task and WeeklySummary models

Revision ID: 5ba00e5c8cce
Revises: 
Create Date: 2025-06-08 13:55:38.822481

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '5ba00e5c8cce'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Create enum type manually to avoid SQLAlchemy auto-creation
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'focuslevel') THEN
                CREATE TYPE focuslevel AS ENUM ('low', 'medium', 'high', 'no_tasks');
            END IF;
        END $$
    """)
    
    # Create tasks table using raw SQL to have better control
    op.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            time_spent FLOAT,
            focus_level focuslevel NOT NULL,
            date_worked DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.create_index(op.f('ix_tasks_date_worked'), 'tasks', ['date_worked'], unique=False)
    
    # Create weekly_summaries table
    op.create_table('weekly_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('week_start', sa.String(), nullable=False),
        sa.Column('week_end', sa.String(), nullable=False),
        sa.Column('summary', sa.String(), nullable=False),
        sa.Column('stats', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('similarity', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weekly_summaries_week_start'), 'weekly_summaries', ['week_start'], unique=False)
    op.create_index(op.f('ix_weekly_summaries_week_end'), 'weekly_summaries', ['week_end'], unique=False)
    
    # Create vector index for embeddings (cosine similarity)
    op.execute("""
        CREATE INDEX weekly_summaries_embedding_idx 
        ON weekly_summaries USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop vector index first
    op.execute("DROP INDEX IF EXISTS weekly_summaries_embedding_idx")
    
    op.drop_index(op.f('ix_weekly_summaries_week_end'), table_name='weekly_summaries')
    op.drop_index(op.f('ix_weekly_summaries_week_start'), table_name='weekly_summaries')
    op.drop_table('weekly_summaries')
    op.drop_index(op.f('ix_tasks_date_worked'), table_name='tasks')
    op.drop_table('tasks')
    
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS focuslevel")
    
    # Note: We don't drop the vector extension as it might be used by other applications
