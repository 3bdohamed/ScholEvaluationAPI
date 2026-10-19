using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ScholEvaluationAPI.Controllers;
using ScholEvaluationAPI.Data;
using System.Net;
using System.Net.Sockets;
using System.Text;
var builder = WebApplication.CreateBuilder(args);


// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<appdbcontext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("sqliteConnection")));
builder.Services.AddControllers().AddJsonOptions(options =>
{
   options.JsonSerializerOptions.ReferenceHandler=System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ValidateIssuerSigningKey=true,
        IssuerSigningKey=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
var localIp = Dns.GetHostEntry(Dns.GetHostName()).AddressList.FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork)?
    .ToString() ?? "localhost";
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => policy.WithOrigins("http://localhost:5100", "http://localhost:3000",$"http://{localIp}:5100", $"http://{localIp}:3000")
    .AllowAnyHeader().AllowAnyMethod());
}
    );
builder.Services.AddAuthorization();
var app = builder.Build();


Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine("\n=========================================");
Console.WriteLine($"App is running on:");
Console.WriteLine($" -Local:http://localhost:5100");
Console.WriteLine($" -Network: http://{localIp}:5100");
Console.WriteLine("\n=========================================");
Console.ResetColor();


app.UseCors("AllowReactApp");
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<appdbcontext>();
    context.Database.Migrate();
    await dbinitializer1.SeedManagerAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
if (OperatingSystem.IsWindows() && app.Environment.IsDevelopment())
{
    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
    {
        FileName = "explorer.exe",
        Arguments = $"http://{localIp}:5100",
        UseShellExecute = true
    });
}

app.Run();
