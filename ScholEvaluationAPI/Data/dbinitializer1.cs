using Microsoft.AspNetCore.Identity;
using ScholEvaluationAPI.Models;
namespace ScholEvaluationAPI.Data
{
    public static class dbinitializer1
    {
        public static readonly PasswordHasher<Manegar> _hasher = new PasswordHasher<Manegar>();
        public static async Task SeedManagerAsync(appdbcontext context)
        {
            if (!context.Manegars.Any())
            {
                var manager = new Manegar
                {
                    Name = "admin_manager",
                    addexercise = true,
                    addsubject = true,
                    addteacher = true,
                    addstudent = true,
                    linkteachertostudent = true,
                    isOnlyManegar = true
                };
                manager.Password = _hasher.HashPassword(manager, "superpassword123!");
                await context.Manegars.AddAsync(manager);
                await context.SaveChangesAsync();
               
            }
        }
    }
}
