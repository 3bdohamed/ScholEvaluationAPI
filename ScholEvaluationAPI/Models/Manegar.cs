using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ScholEvaluationAPI.Models
{
    [Index(nameof(isOnlyManegar),IsUnique =true)]
    public class Manegar
    {
        [Key]
        public int ID { get; set;}
        public string Name { get; set;}
        public string Password { get; set; }
        public bool addteacher { get; set; }
        public bool addstudent { get; set; }
        public bool linkteachertostudent { get; set; }
        public bool addexercise { get; set; }
        public bool addsubject { get; set; }
        public bool isOnlyManegar { get; set; }=true;


    }
}
