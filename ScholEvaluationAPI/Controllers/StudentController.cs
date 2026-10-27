using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;
using System.ComponentModel;
using System.Security.Claims;

namespace ScholEvaluationAPI.Controllers
{

    [ApiController]
    [Route("api/students")]
    public class StudentController : Controller
    {
        private readonly appdbcontext _context;
        private readonly ILogger<StudentController> _logger;
        public StudentController(appdbcontext appdbcontext,ILogger<StudentController>logger)
        {
            _context = appdbcontext;
            _logger = logger;
        }


        [HttpGet]
        [Route("")]
        [Authorize(Roles = "Manager")]
        public IActionResult Get()
        {
            IEnumerable<student> students = _context.students.Include(s => s.studentclasses).ToList();
            return Ok(students);

        }
        [HttpGet]
        [Route("{id}")]
        [Authorize(Roles = "Manager,Student")]
        public IActionResult Getbyid(int id)
        {
            var studentrole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (studentrole == "Student")
            {
                student student = _context.students
               .Include(s => s.studentclasses.teatcherstudents).ThenInclude(s=>s.teacher.subjects)
               .Include(s => s.solvedexercises).ThenInclude(s => s.exercise).ThenInclude(s=>s.subjects)
               .Include(s => s.solvedexercises).ThenInclude(s => s.paragraphs).ThenInclude(s => s.sqwrites).ThenInclude(s=>s.qwrite)
               .Include(s => s.solvedexercises).ThenInclude(s => s.paragraphs)
               .Include(s => s.solvedexercises).ThenInclude(s => s.paragraphs).ThenInclude(s => s.solvedquestion)
               .Include(s => s.solvedexercises).ThenInclude(s => s.question)
               .Include(s => s.solvedexercises).ThenInclude(s => s.sqwrites).ThenInclude(s=>s.qwrite)
               .FirstOrDefault(s => s.studentcode == User.FindFirst(ClaimTypes.Name).Value);
                student.studentclasses.students = null;
                foreach (var item in student.studentclasses.teatcherstudents)
                {
                    item.studentclasses = null;
                    item.teacher.teatcherstudents = null;
                }
                foreach (var item in student.solvedexercises)
                {
                    item.exercise.qwrites = null;
                    item.exercise.question = null;
                    item.exercise.paragraphs = null;
                    item.exercise.solveds = null;
                    foreach (var item1 in item.sqwrites)
                    {
                        item1.qwrite.exercisee = null;
                        item1.qwrite.sqwrites = null;
                    }
                    //foreach (var item1 in item.paragraphs)
                    //{
                    //    foreach (var item2 in item1.sqwrites)
                    //    {
                    //        item2.qwrite.exercisee = null;
                    //        item2.qwrite.paragraphh = null;
                    //        item2.qwrite.sqwrites = null;
                    //    }
                    //}
                }
                
                student.studentclasses.students = null;
                if (student != null)
                {

                    return Ok(student);
                }
                return NotFound();
            }
            else
            {
                student student = _context.students
                    .Include(s => s.studentclasses.teatcherstudents).ThenInclude(s => s.teacher.subjects)
                    .Include(s => s.solvedexercises)
                    .Include(s => s.solvedexercises).ThenInclude(s => s.paragraphs).ThenInclude(s => s.sqwrites)
                    .Include(s => s.solvedexercises).ThenInclude(s => s.paragraphs).ThenInclude(s => s.solvedquestion)
                    .Include(s => s.solvedexercises).ThenInclude(s => s.question)
                    .Include(s => s.solvedexercises).ThenInclude(s => s.sqwrites)
                    .FirstOrDefault(s => s.id == id);
                if (student != null)
                {

                    return Ok(student);
                }
                return NotFound();
            }
        }
        [HttpPost]
        [Route("")]
        public IActionResult Post([FromBody] student student)
        {
            student.create_at = DateTime.Now;
            if (ModelState.IsValid)
            {
                student b = _context.students.FirstOrDefault(t => t.studentcode == student.studentcode);
                if (b != null)
                {
                    return BadRequest("this student code is used");
                }
                student.password = (487 * Random.Shared.Next(100000, 99999900)).ToString("X");
                _context.students.Add(student);
                _context.SaveChanges();
                return Ok(student);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpPut]
        [Route("{id}")]
        [Authorize(Roles = "Manager")]
        public IActionResult Put(int id, [Bind("id, name, studentclass, group"), FromBody] transportdata student)
        {
            if (id != student.id)
            {
                return BadRequest();
            }
            student a = _context.students.Find(student.id);
            if (a == null)
            {
                return NotFound();
            }
            a.name = student.name;
            a.group = student.group;
            a.studentclass = student.studentclass;

            if (ModelState.IsValid)
            {
                _context.students.Update(a);
                _context.SaveChanges();
                return Ok(a);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpDelete]
        [Route("{id}")]
        [Authorize(Roles = "Manager")]
        public IActionResult Delete(int id, [FromBody] transportdata data) {
            student a = _context.students.Include(e=>e.solvedexercises).ThenInclude(e=>e.question)
                .Include(e => e.solvedexercises).ThenInclude(e=>e.sqwrites)
                .Include(e => e.solvedexercises).ThenInclude(e=>e.paragraphs).ThenInclude(e => e.sqwrites)
                .Include(e => e.solvedexercises).ThenInclude(e => e.paragraphs).ThenInclude(e => e.solvedquestion)
                .FirstOrDefault(e=>e.id==id);
            if(a == null)
            {
                return NotFound();
            }
            if (a.password==data.password)
            {
                //_context.Solvedexercise.RemoveRange(a.solvedexercises);
                a.solvedexercises.ToList().Clear();
                a.solvedexercises.SelectMany(e=>e.question).ToList().Clear();
                a.solvedexercises.SelectMany(e => e.sqwrites).ToList().Clear();
                a.solvedexercises.SelectMany(e => e.paragraphs).SelectMany(e=>e.sqwrites).ToList().Clear();
                a.solvedexercises.SelectMany(e => e.paragraphs).SelectMany(e => e.solvedquestion).ToList().Clear();

                _context.SaveChanges();
                _context.students.Remove(a);
                _context.SaveChanges();
                return Ok(_context.students.ToList());
            }
            else
            {
                return BadRequest($"the password({data.password}) is not true");
            }
        }
        [HttpPost]
        [Route("addclass")]
        [Authorize(Roles = "Manager")]
        public IActionResult addclass(transportdata data)
        {
            student student = _context.students.Include(s=>s.studentclasses).FirstOrDefault(s => s.id == data.id);
            if (student == null)
            {
                return NotFound();
            }
            studentclasses studentclasses = _context.studentclasses.FirstOrDefault(s=>s.Id==data.number);
            if (studentclasses == null)
                return NotFound("the class not found");
            if (data.password != student.password)
                return BadRequest("the password isn't correct");
            
            if (ModelState.IsValid)
            {
                student.studentclasses = studentclasses;
                _context.SaveChanges();
                return Ok(student);
            }
            else
            {
                return BadRequest();
            }
            

        }
        [HttpDelete]
        [Route("removeclass")]
        [Authorize(Roles = "Manager")]
        public IActionResult removeclass(transportdata data)
        {
            student student = _context.students.Include(s => s.studentclasses).FirstOrDefault(s => s.id == data.id);
            if (student == null)
            {
                return NotFound();
            }
            studentclasses studentclasses = _context.studentclasses.FirstOrDefault(s => s.Id == data.number);
            if (studentclasses == null)
                return NotFound("the class not found");
            if (student.studentclasses?.Id != data.number||student.studentclasses==null)
            { return BadRequest($"the student({student.name}) is not at this class ({studentclasses.name})"); }
            if (data.password != student.password)
                return BadRequest("the password isn't correct");

            if (ModelState.IsValid)
            {
                student.studentclasses = null;
                _context.SaveChanges();
                return Ok(student);
            }
            else
            {
                return BadRequest();
            }


        }
    }
}
