using firstweb.Models;
using Microsoft.EntityFrameworkCore;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.questiongroup;

namespace ScholEvaluationAPI.Data
{
    public class appdbcontext:DbContext
    {
        public appdbcontext(DbContextOptions<appdbcontext> options) : base(options)
        {
           
        }
        public DbSet<student> students { get; set; }
        public DbSet<choose> chooses { get; set; }
        public DbSet<exercise> exercises { get; set; }
        public DbSet<solvedexercise> Solvedexercise { get; set; }
        public DbSet<SolvedChoose> Solvedchooses { get; set; }
        public DbSet<teacher> Teachers { get; set; }
        public DbSet<teatcherstudent> Teatcherstudents { get; set; }
        public DbSet<Manegar> Manegars { get; set; }
        public DbSet<subject> subjects { get; set; }
        public DbSet<studentclasses> studentclasses { get; set; }
        public DbSet<paragraph> paragraphs { get; set; }
        public DbSet<qwrite> qwrites { get; set; }
        public DbSet<sqwrite> solvedqwrites { get; set; }

        }
}
