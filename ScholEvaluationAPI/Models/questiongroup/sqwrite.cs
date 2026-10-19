using firstweb.Models;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScholEvaluationAPI.Models.questiongroup
{
    public class sqwrite
    {
        public int id { get; set; }
        public string answer { get; set; }
        public string? Ask => qwrite?.Ask;
        public string? type => qwrite?.type;
        public string? title => qwrite?.title;
        public string? answerexample => qwrite?.answerexample;
        [DefaultValue(1)]
        public int? totaldegree { get; set; }
        [DefaultValue(0)]
        public int? correctdegree { get; set; }

        [ForeignKey(nameof(Models.qwrite))]
        public int qweiteid { get; set; }
        public qwrite? qwrite { get; set; }

        [ForeignKey(nameof(solvedexercise))]
        public int? solvedexerciseid { get; set; }
        public solvedexercise? solvedexercisee { get; set; }

        [ForeignKey(nameof(sparagraph))]
        public int? sparagraphid { get; set; }
        public sparagraph? sparagraphh { get; set; }

    }
}
