using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.questiongroup;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace firstweb.Models
{
    public class exercise
    {
        [Key]
        public int id { get; set; }
        [AllowedValues(["secondary"],ErrorMessage ="the field must be 'secondary'")]
        public string stage { get; set; }
        [AllowedValues(["secondary1", "secondary2", "secondary3"], ErrorMessage = "the field must be 'secondary1','secondary2'or'secondary3'")]
        public string classname { get; set; }
        [Required]
        [ForeignKey(nameof(subject))]
        public int subjectid { get; set; }
        public subject? subjects { get; set; }
        public string? evaluationNum { get; set; }

        // public DateTime began { get; set; }
        //public DateTime end { get; set; }
        [AllowedValues(["Evaluation A", "Evaluation B","Evaluation C", "Class Assiment","Home Assiment"], ErrorMessage = "the field must be [\"Evaluation A\", \"Evaluation B\",\"Evaluation C\", \"Class Assiment\",\"Home Assiment\"]")]
        public string type { get; set; } 
        public ICollection<choose>? question { get; set; }
        public ICollection<qwrite>? qwrites { get; set; }
        public ICollection<solvedexercise>? solveds { get; set; }
        public ICollection<paragraph>? paragraphs { get; set; }
        public int degrees => (question?.Count() ?? 0) + (qwrites?.Sum(q => q.degrees) ?? 0) + (paragraphs?.Sum(p => p.question?.Count() ?? 0) ?? 0)+ (paragraphs?.Sum(p => p.qwrites?.Sum(a=>a.degrees) ?? 0) ?? 0);
    }
}
