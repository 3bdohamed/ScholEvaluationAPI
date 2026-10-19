# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["ScholEvaluationAPI.csproj", "./"]
RUN dotnet restore "ScholEvaluationAPI.csproj"

# Copy remaining sources and publish
COPY . .
RUN dotnet publish "ScholEvaluationAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 8080

# At runtime bind to the port provided by the environment (Render sets $PORT)
ENTRYPOINT ["sh", "-c", "export ASPNETCORE_URLS=http://+:${PORT:-8080} && exec dotnet ScholEvaluationAPI.dll"]