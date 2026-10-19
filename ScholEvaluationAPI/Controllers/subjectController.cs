using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;

namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/subject")]
    [Authorize(Roles = "Manager")]

    public class subjectController : Controller
    {
        private readonly appdbcontext _context;
        public subjectController(appdbcontext appdbcontext)
        {
            _context = appdbcontext;
        }
        [HttpGet]
        [Route("")]
        public IActionResult Get()
        {
            IEnumerable<subject> subjects = _context.subjects.ToList();
            return Ok(subjects);
        }
        [HttpGet]
        [Route("{id}")]
        public IActionResult Getbyid(int id)
        {
            subject subject= _context.subjects.Find(id);
            if (subject != null)
            {

                return Ok(subject);
            }
            return NotFound();
        }

        [HttpPost]
        [Route("")]
        public IActionResult Post([FromBody] subject subject)
        {
            if (ModelState.IsValid)
            {
                _context.subjects.Add(subject);
                _context.SaveChanges();
                return Ok(subject);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [HttpPut]
        [Route("{id}")]
        public IActionResult Put(int id, [FromBody] subject subject)
        {
            if (id != subject.Id)
            {
                return BadRequest();
            }
            subject a = _context.subjects.Find(subject.Id);
            if (a == null)
            {
                return NotFound();
            }
            a.SubjectName = subject.SubjectName;


            if (ModelState.IsValid)
            {
                _context.subjects.Update(a);
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
        public IActionResult Delete(int id, [FromBody] transportdata data)
        {
            subject a = _context.subjects.Find(id);
            if (a == null)
            {
                return NotFound();
            }

            if (a.Teacher==null||a.Teacher?.Count==0)
            {
                _context.subjects.Remove(a);
                _context.SaveChanges();
                return Ok(_context.subjects.ToList());
            }
            else
            {
                return BadRequest("you must delete the teacher has this subject \n" + a.Teacher?.ToList());
            }
           
        }
    }
}
