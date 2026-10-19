# School Evaluation

The ASP.NET Core API project serves the Next.js frontend from the same host. The frontend source is in `ScholEvaluationAPI\frontend`.

## Run the combined app

Install .NET 10 and Node.js with npm, then run this from the repository root:

```powershell
dotnet run --project .\ScholEvaluationAPI\ScholEvaluationAPI.csproj
```

The first build installs the frontend dependencies if needed, builds a static Next.js export, and copies it into the API's `wwwroot`. Open [http://localhost:5100](http://localhost:5100).

To work on the frontend with Next.js hot reload, start the API as above, then in a second terminal run:

```powershell
Set-Location .\ScholEvaluationAPI\frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development frontend sends API requests to port 5100.

## API routes

All controller endpoints use the `/api` prefix, for example `/api/authentication/login`, `/api/teacher`, and `/api/students`. The API prefix keeps endpoints separate from frontend routes such as `/teacher` and `/student`.
