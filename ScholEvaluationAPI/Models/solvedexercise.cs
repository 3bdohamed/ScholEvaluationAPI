using ScholEvaluationAPI.Models.questiongroup;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace firstweb.Models
{
    public class solvedexercise
    {
        [Key]
        public int id { get; set; }
        [ForeignKey("exercise")]
        public int exerciseid { get; set; }
        public exercise? exercise { get; set; }
        public int correctanswer { get; set; }
        public int totalanswer { get; set; }

        public ICollection<SolvedChoose>? question { get; set; }
        public ICollection<sqwrite>?  sqwrites { get; set; }
        public ICollection<sparagraph>? paragraphs { get; set; }
        [ForeignKey("student")]
        public int studentid { get; set; }
        public student? student{ get; set; }
        [AllowedValues(["Evaluation A", "Evaluation B", "Evaluation C", "Class Assiment", "Home Assiment"])]
        public string type { get; set; }
        [DefaultValue(false)]
        public bool? iscorrected { get; set; }
        public DateTime? senddate { get; set; } = DateTime.Now;
    }
}
