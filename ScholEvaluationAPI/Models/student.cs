using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholEvaluationAPI.Models;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.Design.Serialization;
using System.Text.RegularExpressions;

namespace firstweb.Models
{
    [Index(nameof(studentcode),IsUnique =true)]
    public class student
    {
        public int id {get; set; }
        [Required]
        public required string name { get; set; }
        [Required]
        [RegularExpression("[0-9]{9}")]
        public string studentcode {  get; set; }
        //public string studentcode => (((id * 5) + (97)) * 13).ToString();
        public required string password { get; set; }
        [Required]
        [AllowedValues(["secondary1", "secondary2", "secondary3"])]
        public string studentclass { get; set; } = "secondary1";
        [Required]
        [AllowedValues(["A", "B", "C"])]
        public string group { get; set; } ="A";
        public string? authority { get; set;}
        public DateTime create_at { get; set; }
        public DateTime? authorityDate { get; set; }
        public DateTime? closetime => authorityDate?.AddMinutes(45);
        public IEnumerable<solvedexercise>? solvedexercises { get; set; }
        public studentclasses? studentclasses { get; set; }
}
}
