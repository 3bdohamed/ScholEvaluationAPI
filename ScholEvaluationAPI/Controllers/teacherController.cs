using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Logging;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;
using System.Security.Claims;

namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/teacher")]
    public class teacherController : Controller
    {
        private readonly appdbcontext _context;
        private readonly ILogger<teacherController> _logger;
        public teacherController(appdbcontext appdbcontext, ILogger<teacherController> logger)
        {
            _context = appdbcontext;
            _logger = logger;
        }
        [HttpGet]
        [Route("")]
        [Authorize(Roles = "Manager")]
        public IActionResult Get()
        {
            IEnumerable<teacher> teachers = _context.Teachers.Include(t=>t.teatcherstudents).Include(t => t.subjects).ToList();
            return Ok(teachers);
        }
        [HttpGet]
        [Route("{id}")]
        [Authorize(Roles = "Manager,Teacher")]
        public IActionResult Getbyid(int id)
        {
            var usertrole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userid = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (usertrole == "Teacher")
            {
                teacher t = _context.Teachers.Include(t => t.teatcherstudents)
                    .ThenInclude(t => t.studentclasses).ThenInclude(t => t.students)
                    .Include(t => t.subjects)
                    .FirstOrDefault(t => t.id == Convert.ToInt16(userid));
                t.subjects.Teacher = null;
                if (t != null)
                {
                    t.subjects?.Teacher = null;
                    return Ok(t);
                }
                return NotFound();
            }
            teacher teacher = _context.Teachers.Include(t => t.teatcherstudents)
                .ThenInclude(t=>t.studentclasses).ThenInclude(t=>t.students)
                .Include(t => t.subjects).FirstOrDefault(t => t.id == id);
            if (teacher != null)
            {
                teacher.subjects?.Teacher = null;
                return Ok(teacher);
            }
            return NotFound();
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("")]
        public IActionResult Post([FromBody] teacher teacher)
        {
            if (teacher.subjectid == 0)
            {
                return BadRequest("subject id and teacher code  mustn't be null");
            }
            teacher b = _context.Teachers.FirstOrDefault(t => t.teatchercode == teacher.teatchercode);
            if (b != null)
            {
                return BadRequest("this teacher code is used");
            }
            subject subject = _context.subjects.Find(teacher.subjectid);
            if (subject == null)
            {
                return BadRequest("the subject isn't found");
            }
            if (ModelState.IsValid)
            {
                teacher.password = (487 * Random.Shared.Next(100000, 99999900)).ToString("X");
                _context.Teachers.Add(teacher);
                _context.SaveChanges();
                teacher.subjects?.Teacher = null;
                return Ok(teacher);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpPut]
        [Authorize(Roles = "Manager")]
        [Route("{id}")]
        public IActionResult Put(int id, [FromBody] teacher teacher)
        {
            if (id != teacher.id)
            {
                return BadRequest("the teacher not found");
            }
            if (teacher.subjectid == 0)
            {
                return BadRequest("subject id and teacher code  mustn't be null");
            }
            subject subject = _context.subjects.Find(teacher.subjectid);
            if (subject == null)
            {
                return BadRequest("the subject isn't found");
            }
            teacher a = _context.Teachers.Find(teacher.id);
            if (a == null)
            {
                return NotFound();
            }
            a.firstname = teacher.firstname;
            a.goverment = teacher.goverment;
            a.subjectid = teacher.subjectid;
            a.lastname = teacher.lastname;
            a.schoolname = teacher.schoolname;


            if (ModelState.IsValid)
            {
                _context.Teachers.Update(a);
                _context.SaveChanges();
                return Ok(a);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpDelete]
        [Authorize(Roles = "Manager")]
        [Route("{id}")]
        public IActionResult delete(int id, [FromBody] transportdata data)
        {
            if (id == 0 || id != data.id)
            {
                return NotFound();
            }
            teacher teacher = _context.Teachers.Find(id);
            if (teacher == null)
            {
                return NotFound();
            }
            if (teacher.password != data.password)
            {
                return BadRequest("the password is'n correct");
            }
            _context.Teachers.Remove(teacher);
            _context.SaveChanges();
            return Ok(_context.Teachers.Include(t=>t.subjects).ToList());
        }




        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("addclass")]
        public IActionResult addclass(transportdata data)
        {
            studentclasses studentclasses =_context.studentclasses.FirstOrDefault(s=>s.Id== data.number);
            if(studentclasses == null)
            {
                return NotFound("the class not found");
            }
            teacher teacher = _context.Teachers.Include(t=>t.teatcherstudents).FirstOrDefault(s=>s.id==data.id);
            if (teacher == null)
            {
                return NotFound("the teacher not found");
            }
            if (data.password != teacher.password)
            {
                return BadRequest("the teacher password isn't correct");
            }
            var check = teacher.teatcherstudents?.Where(a => a.studentclassid == data.number);
            if (check?.Count() != 0)
            {
                return BadRequest("the teacher already in this class");
            }
            teatcherstudent teatcherstudent=new teatcherstudent();
            teatcherstudent.studentclassid = studentclasses.Id;
            teatcherstudent.teacherId = teacher.id;
            teatcherstudent.teachercode = teacher.teatchercode;
            _context.Teatcherstudents.Add(teatcherstudent);
            _context.SaveChanges();
            return Ok(teacher);

        }
        [HttpDelete]
        [Route("removeclass")]
        [Authorize(Roles = "Manager")]
        public IActionResult removeclass(transportdata data)
        {
            teatcherstudent teatcherstudent = _context.Teatcherstudents.Include(s=>s.teacher).FirstOrDefault(s=>s.id==data.id);
            if (teatcherstudent == null)
                return NotFound("the teacher not found");
            teacher teacher = _context.Teachers.Include(t=>t.teatcherstudents).FirstOrDefault(t=>t.id==teatcherstudent.teacherId);
            if (teatcherstudent.teacher.password != data.password)
                return BadRequest("the password isn't correct");
            _context.Teatcherstudents.Remove(teatcherstudent);
            _context.SaveChanges();
            return Ok(teacher);
        }
        [HttpPost]
        [Route("open")]
        [Authorize(Roles = "Teacher")]
        public IActionResult open(transportdata data)
        {
            student student = _context.students.Include(s => s.solvedexercises).FirstOrDefault(e => e.id == data.id);
            if (student == null) 
            {
                return NotFound();
            }
            exercise exercise = _context.exercises.FirstOrDefault(e => e.id == data.number);
            if (exercise == null)
            {
                return NotFound();
            }
            if (student.solvedexercises?.FirstOrDefault(e => e.exerciseid == data.number) != null)
            {
                return BadRequest("the student has already solved this exercise");
            }
            if (student.studentclass != exercise.classname)
            { return BadRequest($"the student is ({student.studentclass}) and exercise is ({exercise.classname})"); }
            student.authority = exercise.id.ToString();
            student.authorityDate = DateTime.Now;
            //student.closetime = DateTime.Now.AddMinutes(45);
            _context.SaveChanges();
            return Ok(student);
        }
        [HttpPost]
        [Route("open/many")]
        [Authorize(Roles = "Teacher")]
        public IActionResult end([FromBody] EndAssignRequest data)
        {
            if (data?.Ids == null || !data.Ids.Any())
            {
                return BadRequest("no student ids provided");
            }

            var exercise = _context.exercises.FirstOrDefault(e => e.id == data.Number);
            if (exercise == null)
            {
                return NotFound($"exercise {data.Number} not found");
            }

            var students = _context.students
                .Include(s => s.solvedexercises)
                .Where(s => data.Ids.Contains(s.id))
                .ToList();

            var notFoundIds = data.Ids.Except(students.Select(s => s.id)).ToList();

            var updated = new List<student>();
            var skipped = new List<object>();

            foreach (var student in students)
            {
                if (student.solvedexercises?.Any(e => e.exerciseid == data.Number) == true)
                {
                    skipped.Add(new { id = student.id, reason = "already solved" });
                    continue;
                }

                if (student.studentclass != exercise.classname)
                {
                    skipped.Add(new { id = student.id, reason = $"class mismatch ({student.studentclass} != {exercise.classname})" });
                    continue;
                }

                student.authority = exercise.id.ToString();
                student.authorityDate = DateTime.Now;
                updated.Add(student);
            }

            _context.SaveChanges();

            var result = new
            {
                updatedCount = updated.Count,
                updatedIds = updated.Select(s => s.id),
                skipped,
                notFoundIds
            };

            return Ok(result);
        }

        public class EndAssignRequest
        {
            public List<int> Ids { get; set; }
            public int Number { get; set; }
        }
    }
}
