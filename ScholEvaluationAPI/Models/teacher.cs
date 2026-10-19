using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ScholEvaluationAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace firstweb.Models
{
    [Index(nameof(teatchercode), IsUnique = true)]
    public class teacher
    {
        public int id { get; set; }
        public string firstname { get; set; }
        [Required]
        [RegularExpression("[0-9]{10}")]
        
        public string  teatchercode {  get; set; }
        //public string teatchercode => (((id * 5) + (97)) * 13).ToString();
        public string lastname { get; set; }
        [Required]
        [ForeignKey(nameof(subject))]
        public int subjectid { get; set; }
        public subject? subjects { get; set; }
        //public int secondsubjectid { get; set; }
        //[ForeignKey(nameof(subject))]
        //public subject? secondsubjects { get; set; }
        public string? subjectname => subjects?.SubjectName;
        public string goverment { get; set; }
        public string schoolname { get; set; }
        public string password { get; set; }
        //public string password => (((id * 7) + 193) * 13).ToString("X");
        //public string? discripe { get; set; } = "";
        public IEnumerable<teatcherstudent>? teatcherstudents { get; set; }
        

    }
}
