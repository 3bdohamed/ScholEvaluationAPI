using firstweb.Models;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholEvaluationAPI.Models.questiongroup
{
    public class sparagraph
    {
        public int id { get; set; }
        public string? title => paragraph?.title;
        public string? paragraphbody => paragraph?.paragraphbody;

        public ICollection<sqwrite>? sqwrites { get; set; }

        [ForeignKey(nameof(questiongroup.paragraph))]
        public int paragraphid { get; set; }
        public paragraph? paragraph { get; set; }

        public ICollection<SolvedChoose>? solvedquestion { get; set; }

        [ForeignKey(nameof(solvedexercise))]
        public int? solvedexerciseid { get; set; }
        public solvedexercise? solvedExercise { get; set; }
        public int totaldegree { get; set; }
        public int correctdegree { get; set; }
    }
}
