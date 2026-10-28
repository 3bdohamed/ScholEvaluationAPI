using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholEvaluationAPI.Data;
using System.Security.Claims;

namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/solvedexercise")]
    public class solvedexerciseController : Controller
    {
        readonly private appdbcontext _context;
        readonly private ILogger<solvedexerciseController> _logger;
        public solvedexerciseController(appdbcontext appdbcontext,ILogger<solvedexerciseController> logger)
        {
            _context = appdbcontext;
            _logger = logger;
        }
        [HttpGet]
        [Route("")]
        [Authorize(Roles = "Teacher,Student")]
        public IActionResult teacherpage()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Alternative: Get specific custom claim
            var usercode = User.FindFirst(ClaimTypes.Name)?.Value;
            var usertype = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            if (usertype == "Teacher")
            {
                var teacher = _context.Teachers.FirstOrDefault(t => t.id == Convert.ToInt16(userId));
                // Filter data by user
                var solvedexercises = _context.Solvedexercise
                    .Where(e => e.exercise.subjectid == teacher.subjectid)
                    .Where(e => e.student.studentclasses.teatcherstudents.FirstOrDefault(e => e.teacherId == teacher.id) != null);

                return Ok(solvedexercises);
            }else if (usertype == "Student")
            {
                var student = _context.students.FirstOrDefault(s => s.id == Convert.ToInt16(userId));
                var solvedexercise = _context.Solvedexercise.Where(e => e.studentid == student.id);
                return Ok(solvedexercise);
            }
            else
            {
                return Unauthorized();
            }
        }
        [HttpGet]
        [Route("{id}")]
        [Authorize(Roles = "Teacher,Student")]
        public IActionResult teacherpage(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Alternative: Get specific custom claim
            var usercode = User.FindFirst(ClaimTypes.Name)?.Value;
            var usertype = User.FindFirst(ClaimTypes.Role)?.Value;
            if (usertype == "Teacher")
            {
                var teacher = _context.Teachers.FirstOrDefault(t => t.id == Convert.ToInt16(userId));
                var solvedexercise = _context.Solvedexercise
                    .Include(e => e.sqwrites).ThenInclude(e=>e.qwrite)
                    .Include(e => e.question)
                    .Include(e => e.paragraphs).ThenInclude(e => e.sqwrites).ThenInclude(e => e.qwrite)
                    .Include(e => e.paragraphs).ThenInclude(e => e.solvedquestion)
                    .Where(e => e.exercise.subjectid == teacher.subjectid)
                    .Where(e => e.student.studentclasses.teatcherstudents.FirstOrDefault(e => e.teacherId == teacher.id) != null)
                    .FirstOrDefault(e => e.id == id);

                if (solvedexercise == null)
                    return NotFound();
                return Ok(solvedexercise);
            }else if (usertype == "Student")
            {
                var student = _context.students.FirstOrDefault(e => e.id == Convert.ToInt16(userId));

                var solvedexercise = _context.Solvedexercise
                    .Include(e => e.sqwrites)
                    .Include(e => e.question)
                    .Include(e => e.paragraphs).ThenInclude(e => e.sqwrites).ThenInclude(e => e.qwrite)
                    .Include(e => e.paragraphs).ThenInclude(e => e.solvedquestion)
                    .Where(e => e.studentid == student.id)
                    .FirstOrDefault(e=>e.id==id);
                if (solvedexercise == null)
                    return NotFound();
                return Ok(solvedexercise);
            }
            else
            {
                return Unauthorized();
            }
        }
        [HttpPost]
        [Route("")]
        [Authorize(Roles = "Teacher,Student")]
        public IActionResult correct([FromBody] solvedexercise solvedexercise)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var ex = _context.Solvedexercise
                .Include(e=>e.exercise)
                .Include(e => e.question)
                .Include(e => e.paragraphs).ThenInclude(e => e.solvedquestion)
                .Include(e=>e.sqwrites)
                .Include(e=>e.paragraphs).ThenInclude(e=>e.sqwrites)
                .FirstOrDefault(s => s.id == solvedexercise.id);
            if (ex == null)
                return NotFound();
            //if (ex.iscorrected == true)
            //    return BadRequest("the exercise already corrected");
            for (var i = 0; i < solvedexercise.sqwrites.Count(); i++)
            {
                if (solvedexercise.sqwrites.ToList()[i].id == ex.sqwrites.ToList()[i].id)
                {
                    ex.sqwrites.ToList()[i].correctdegree = solvedexercise.sqwrites.ToList()[i].correctdegree;
                    ex.sqwrites.ToList()[i].totaldegree = solvedexercise.sqwrites.ToList()[i].totaldegree;
                }
            }
            foreach (var item in solvedexercise.paragraphs)
            {
                foreach(var item2 in ex.paragraphs)
                {
                    for (var i = 0; i < item.sqwrites.Count(); i++)
                    {
                        if (item.sqwrites.ToList()[i].id == item2.sqwrites.ToList()[i].id)
                        {
                            item2.sqwrites.ToList()[i].correctdegree = item.sqwrites.ToList()[i].correctdegree;
                            item2.sqwrites.ToList()[i].totaldegree = item.sqwrites.ToList()[i].totaldegree;
                        }
                    }
                    item2.totaldegree = (item2.solvedquestion?.Count() ?? 0) + (item2.sqwrites.Sum(e => e.totaldegree??0) );
                    item2.correctdegree = (item2.solvedquestion?.Where(e=>e.IsCorrect==true).Count()??0) +
                        (item2.sqwrites.Sum(e => e.correctdegree??0));
                }
            }
            ex.correctanswer = (solvedexercise.question?.Where(e => e.IsCorrect).Count() ?? 0) +
                (solvedexercise.sqwrites?.Sum(e => e.correctdegree ?? 0) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.solvedquestion?.Where(e => e.IsCorrect == true)?.Count()) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.sqwrites?.Sum(e => e.correctdegree) ?? 0) ?? 0);
            ex.totalanswer = (solvedexercise.question?.Count() ?? 0) +
                (solvedexercise.sqwrites?.Sum(e => e.totaldegree ?? 0) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.solvedquestion?.Count()) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.sqwrites?.Sum(e => e.totaldegree) ?? 0) ?? 0);
            ex.iscorrected = true;
            _context.SaveChanges();
            return Ok(ex);
        }
    }
}
