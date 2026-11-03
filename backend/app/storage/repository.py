import json
import uuid
from typing import Optional
from pydantic import BaseModel, Field
from .database import get_db
from ..engine.machine import TMSpecification


class ProjectRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    prompt: Optional[str] = None
    machine_spec: TMSpecification
    input_string: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ProjectRepository:
    """SQLite repository for storing and loading user projects."""

    async def list_projects(self) -> list[dict]:
        db = await get_db()
        try:
            async with db.execute(
                "SELECT id, name, description, prompt, input_string, created_at, updated_at FROM projects ORDER BY updated_at DESC"
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
        finally:
            await db.close()

    async def get_project(self, project_id: str) -> Optional[ProjectRecord]:
        db = await get_db()
        try:
            async with db.execute(
                "SELECT id, name, description, prompt, machine_spec_json, input_string, created_at, updated_at FROM projects WHERE id = ?",
                (project_id,),
            ) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                spec_dict = json.loads(row["machine_spec_json"])
                return ProjectRecord(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    prompt=row["prompt"],
                    machine_spec=TMSpecification.model_validate(spec_dict),
                    input_string=row["input_string"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
        finally:
            await db.close()

    async def save_project(self, project: ProjectRecord) -> ProjectRecord:
        db = await get_db()
        try:
            spec_json = project.machine_spec.model_dump_json()
            await db.execute(
                """
                INSERT INTO projects (id, name, description, prompt, machine_spec_json, input_string, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    prompt = excluded.prompt,
                    machine_spec_json = excluded.machine_spec_json,
                    input_string = excluded.input_string,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    project.id,
                    project.name,
                    project.description,
                    project.prompt,
                    spec_json,
                    project.input_string,
                ),
            )
            await db.commit()
            return project
        finally:
            await db.close()

    async def delete_project(self, project_id: str) -> bool:
        db = await get_db()
        try:
            cursor = await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            await db.commit()
            return cursor.rowcount > 0
        finally:
            await db.close()
