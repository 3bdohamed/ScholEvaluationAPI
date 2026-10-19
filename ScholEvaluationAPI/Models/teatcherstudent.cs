using ScholEvaluationAPI.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace firstweb.Models
{
    public class teatcherstudent
    {
        public int id { get; set; }

        [ForeignKey(nameof(Models.teacher))]
        public int teacherId { get; set; }
        public string teachercode {  get; set; }
        public teacher? teacher { get; set; }

        //[ForeignKey(nameof (Models.student))]
        //public int studentId { get; set; }
        //public int studentCode {  get; set; }
        //public student? student { get; set; }
        [ForeignKey(nameof(studentclasses))]
        public int studentclassid { get; set; }
        public string classname => studentclasses?.name;
        public studentclasses? studentclasses { get; set; }
    }
}
