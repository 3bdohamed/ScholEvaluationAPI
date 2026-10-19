using firstweb.Models;

namespace ScholEvaluationAPI.Models
{
    public class subject
    {
        public int Id { get; set; }
        public string SubjectName { get; set; }
        public ICollection<teacher>? Teacher { get; set; }
    }
}
