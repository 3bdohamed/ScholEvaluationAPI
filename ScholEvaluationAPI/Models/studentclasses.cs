using firstweb.Models;

namespace ScholEvaluationAPI.Models
{
    public class studentclasses
    {
        public int Id { get; set; }
        public string name { get; set; }
        public string stage { get; set; }
        public ICollection<student>? students { get; set; }
        public ICollection<teatcherstudent>? teatcherstudents { get; set; }
    }
}
