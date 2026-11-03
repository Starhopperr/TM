from fastapi import APIRouter, HTTPException
from ...storage.repository import ProjectRepository, ProjectRecord

router = APIRouter(prefix="/api/projects", tags=["Projects"])
repo = ProjectRepository()


@router.get("")
async def list_projects():
    """List all saved projects."""
    return await repo.list_projects()


@router.get("/{project_id}", response_model=ProjectRecord)
async def get_project(project_id: str):
    """Get full project specification by ID."""
    proj = await repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    return proj


@router.post("", response_model=ProjectRecord)
async def save_project(project: ProjectRecord):
    """Save or update a project."""
    return await repo.save_project(project)


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a saved project."""
    success = await repo.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"status": "deleted", "id": project_id}
