# Running Mercek with Docker

Docker packages an application’s code and runtime environment into an image. A container is a running instance of that image. Docker Compose starts and manages multiple containers together.

## How this project is packaged

```text
Browser → localhost:8080 → frontend (Nginx) → backend (FastAPI) → warehouse.duckdb
```

| File | Purpose |
| --- | --- |
| `requirements.txt` | Lists the Python dependencies installed in the backend image |
| `backend/Dockerfile` | Builds the API image with Python, its dependencies, application code, and the prepared warehouse |
| `frontend/Dockerfile` | Builds React using Node.js, then serves the compiled files with Nginx |
| `frontend/nginx.conf` | Serves the website and forwards `/api` requests to the backend container |
| `frontend/nginx-main.conf` | Configures Nginx logging, its process ID, and temporary paths for non-root operation |
| `compose.yaml` | Defines both services and their shared network |
| `.dockerignore`, `frontend/.dockerignore` | Exclude private and unnecessary files from build contexts |

DuckDB is a file-based database, so a third database container is unnecessary. The prepared synthetic `warehouse.duckdb` file is copied into the backend image and opened read-only by the API. Raw CSV files, notebooks, and personal files are excluded from the images.

## 1. Install Docker Desktop

On Windows, follow the [Docker Desktop installation guide](https://docs.docker.com/desktop/setup/install/windows-install/). Complete any required WSL 2 setup or restart, open Docker Desktop, and wait for the Linux container engine to be ready. Then check the installation in a new terminal:

```powershell
docker --version
docker compose version
docker info
```

You do not need to install Python or Node.js separately to run this project with Docker. An internet connection is required for the initial image build.

## 2. Start the application from the repository root

In the directory containing `compose.yaml`, run:

```powershell
docker compose up --build -d
```

`--build` builds the images, and `-d` starts the services in the background. The frontend starts after the backend passes a health check that queries the warehouse.

- Website: **http://localhost:8080**
- API check: **http://localhost:8080/api/summary**
- API documentation: **http://localhost:8080/docs**

Unlike the development setup on ports 5173 and 8000, the browser uses a single address. The backend’s port 8000 is not published to the host; the frontend reaches it over the Compose network. `backend` is the service name on that network, not a credential or external server.

## 3. Verify the services

```powershell
docker compose ps
docker compose logs --tail=50
```

Both services should report `healthy`. The API summary should return 6,284 total employees and 1,485 employees who left. Asking the assistant “How many employees left in 2014?” should return 253.

## 4. Stop or rebuild the application

```powershell
docker compose down
```

This removes the project’s containers and Compose network, not the project files on your computer. The prepared database is part of the image, so restarting the application makes the same data available again. This version does not write to the database. Chat conversations remain in browser memory and are not stored permanently.

After changing application code or `warehouse.duckdb`, run `docker compose up --build -d` again. This Docker setup does not provide the live reload available in the Vite development server.

## Troubleshooting

- **`docker` is not recognized:** Docker Desktop may not be installed, or the terminal may need to be reopened after installation.
- **Cannot connect to the Docker engine:** Check that Docker Desktop is open and the engine is ready.
- **Port 8080 is already in use:** In `compose.yaml`, change `127.0.0.1:8080:8080` to `127.0.0.1:8081:8080`. Only the host port changes; open the site on port 8081.
- **The backend is unhealthy:** Run `docker compose logs backend` and check that `data/processed/warehouse.duckdb` exists in the repository.

## Runtime permissions and proxy configuration

The API runs as `appuser`, and Nginx runs as `nginx`. Both containers use read-only root filesystems. Additional Linux capabilities are dropped, and privilege escalation is disabled. Nginx writes temporary files only to a limited `/tmp` filesystem and listens on port 8080 inside the container. The browser address remains `http://localhost:8080`.

Nginx periodically resolves the API service name through Docker DNS, avoiding a stale backend address after a container is recreated. Connection and response timeouts are configured. API paths and query parameters are forwarded without alteration.

## Verification status

On October 18, 2026, `docker compose up --build -d` successfully built both images and started both containers in a healthy state. Checks through Nginx verified the website, API documentation, and query results: 6,284 employees, 1,485 departures, and 253 departures in 2014. Browser checks covered the dashboard, comparisons, and the assistant’s 2014–2015 comparison table.

Container users, health checks, and read-only filesystem settings were also verified. The backend port is not published; the application is bound to `127.0.0.1:8080` for local access only.

References: [Docker Compose quickstart](https://docs.docker.com/compose/gettingstarted/) · [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/).
