"""Initial migration with Task and WeeklySummary models

Revision ID: 5ba00e5c8cce
Revises: 
Create Date: 2025-06-08 13:55:38.822481

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ba00e5c8cce'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Create tasks table
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('time_spent', sa.Float(), nullable=True),
        sa.Column('focus_level', sa.Enum('low', 'medium', 'high', 'no_tasks', name='focuslevel'), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_date'), 'tasks', ['date'], unique=False)
    
    # Create weekly_summaries table
    op.create_table('weekly_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('week_start', sa.String(), nullable=False),
        sa.Column('week_end', sa.String(), nullable=False),
        sa.Column('summary', sa.String(), nullable=False),
        sa.Column('stats', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('embedding', sa.ARRAY(sa.Float()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weekly_summaries_week_start'), 'weekly_summaries', ['week_start'], unique=False)
    op.create_index(op.f('ix_weekly_summaries_week_end'), 'weekly_summaries', ['week_end'], unique=False)
    
    # Create vector index for embeddings
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
    op.drop_index(op.f('ix_tasks_date'), table_name='tasks')
    op.drop_table('tasks')
    
    # Note: We don't drop the vector extension as it might be used by other applications
