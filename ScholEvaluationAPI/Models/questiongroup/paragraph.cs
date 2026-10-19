using firstweb.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholEvaluationAPI.Models.questiongroup
{
    public class paragraph
    {
        public int id { get; set; }
        public string title { get; set; } = string.Empty;
        public string paragraphbody { get; set; }
        public ICollection<qwrite>? qwrites { get; set; }
        public ICollection<choose>? question { get; set; }
        [ForeignKey(nameof(exercise))]
        public int? exerciseid { get; set; }
        public exercise? exercise { get; set; }
    }
}
