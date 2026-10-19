using ScholEvaluationAPI.Models.questiongroup;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace firstweb.Models
{
    public class choose
    {
        public int id { get; set; }
        public string ask { get; set; }
        public string option1 { get; set; }
        public string option2 { get; set; }
        public string option3 { get; set; }
        public string option4 { get; set; }
        [AllowedValues(["1","2","3","4"],ErrorMessage ="the value must be '1','2','3' or '4'. 1 is the first option ,2 is the second etc...")]
        public string answer { get; set; }
        [ForeignKey(nameof(exercise))]
        public int? exerciseid { get; set; }
        public exercise? exercise { get; set; }
        [ForeignKey(nameof(paragraph))]
        public int? paragraphid { get; set; }
        public paragraph? paragraph { get; set; }
        public ICollection<SolvedChoose>? solvedchooses { get; set; }
    }
}
