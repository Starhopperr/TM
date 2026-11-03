import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_api_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_api_compile_and_validate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Compile
        c_resp = await client.post(
            "/api/tm/compile",
            json={"prompt": "Even number of ones", "provider": "mock"},
        )
        assert c_resp.status_code == 200
        data = c_resp.json()
        assert data["status"] == "success"
        assert data["machine_spec"] is not None

        # Validate
        v_resp = await client.post(
            "/api/tm/validate",
            json={"machine_spec": data["machine_spec"]},
        )
        assert v_resp.status_code == 200
        v_data = v_resp.json()
        assert v_data["valid"] is True


@pytest.mark.asyncio
async def test_api_simulation_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Compile machine
        c_resp = await client.post(
            "/api/tm/compile",
            json={"prompt": "Even number of ones", "provider": "mock"},
        )
        spec = c_resp.json()["machine_spec"]

        # 2. Create simulation with input "10"
        sim_create_resp = await client.post(
            "/api/tm/simulation/create",
            json={"machine_spec": spec, "input_string": "10"},
        )
        assert sim_create_resp.status_code == 200
        sim_data = sim_create_resp.json()
        sim_id = sim_data["simulation_id"]
        assert sim_data["status"] == "RUNNING"
        assert sim_data["configuration"]["step_number"] == 0

        # 3. Step
        step_resp = await client.post(
            "/api/tm/simulation/step",
            json={"simulation_id": sim_id},
        )
        assert step_resp.status_code == 200
        step_data = step_resp.json()
        assert step_data["step_number"] == 1
        assert step_data["configuration"]["current_state"] == "q_odd"

        # 4. Step back (undo)
        back_resp = await client.post(
            "/api/tm/simulation/step_back",
            json={"simulation_id": sim_id},
        )
        assert back_resp.status_code == 200
        back_data = back_resp.json()
        assert back_data["step_number"] == 0
        assert back_data["configuration"]["current_state"] == "q_even"

        # 5. Run to completion
        run_resp = await client.post(
            "/api/tm/simulation/run",
            json={"simulation_id": sim_id, "max_steps": 100},
        )
        assert run_resp.status_code == 200
        run_data = run_resp.json()
        # Input "10" has 1 one -> odd -> REJECT
        assert run_data["status"] == "REJECT"

        # 6. Trace
        trace_resp = await client.get(
            f"/api/tm/simulation/trace?simulation_id={sim_id}"
        )
        assert trace_resp.status_code == 200
        trace_data = trace_resp.json()
        assert trace_data["total_steps"] > 0
