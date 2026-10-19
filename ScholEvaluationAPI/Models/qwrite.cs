using firstweb.Models;
using ScholEvaluationAPI.Models.questiongroup;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholEvaluationAPI.Models
{
    public class qwrite
    {
        public int id { get; set; }
        public string Ask { get; set; }
        [AllowedValues(["Rewrite", "Analise", "Explian", "Give reason", "Justify", "Other"])]
        public string type { get; set; }
        public string? title { get; set; }
        public string answerexample { get; set; }
        public bool isJustify => "Justify" == type;
        public bool? justifyanswer { get; set; }

        [DefaultValue(1)]
        public int? degrees { get; set; } = 1;

        public ICollection<sqwrite>? sqwrites { get; set; }

        [ForeignKey(nameof(exercise))]
        public int? exerciseid { get; set; }
        public exercise? exercisee { get; set; }

        [ForeignKey(nameof(paragraph))]
        public int? paragraphid { get; set; }
        public paragraph? paragraphh { get; set; }
    }}
