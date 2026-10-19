
using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;
using System.Net.NetworkInformation;

namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/studentclass")]
    public class studentsclassController : Controller
    {
        private readonly appdbcontext _context;
        private readonly ILogger<studentsclassController> _logger;
        public studentsclassController(appdbcontext appdbcontext, ILogger<studentsclassController> logger)
        {
            _context = appdbcontext;
            _logger = logger;
        }
        [HttpGet]
        [Authorize(Roles = "Manager")]
        public IActionResult Get()
        {
            IEnumerable<studentclasses> studentclasses = _context.studentclasses.Include(s => s.teatcherstudents).Include(s => s.students);
            return Ok(studentclasses);
        }
        [HttpGet]
        [Route("{id}")]
        [Authorize(Roles = "Manager,Teacher")]
        public IActionResult Get(int id)
        {
            studentclasses studentclasses = _context.studentclasses.Include(s => s.teatcherstudents).ThenInclude(e=>e.teacher).Include(s => s.students).FirstOrDefault(s => s.Id == id);
            if(studentclasses == null)
                return NotFound();
            return Ok(studentclasses);
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("")]
        public IActionResult Post([FromBody] studentclasses studentclasses)
        { 
            if (ModelState.IsValid)
            {
                _context.studentclasses.Add(studentclasses);
                _context.SaveChanges();
                return Ok(studentclasses);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpPut]
        [Authorize(Roles = "Manager")]
        [Route("{id}")]
        public IActionResult Put(int id, [FromBody] studentclasses studentclasses)
        {
            studentclasses a=_context.studentclasses.Include(s => s.teatcherstudents).Include(s => s.students).FirstOrDefault(s=> s.Id == id);
            if (a == null)
                return NotFound();
            if (id != studentclasses.Id)
            {
                return BadRequest("id isn't correct");
            }
            if(ModelState.IsValid)
            {
                a.name = studentclasses.name;
                a.stage= studentclasses.stage;
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
        public IActionResult delete(int id, [FromBody] transportdata data)
        {
            if (id == 0 || id != data.id)
            {
                return NotFound();
            }
            studentclasses studentclasses= _context.studentclasses.Include(s=>s.teatcherstudents).Include(s=>s.students).FirstOrDefault(s=>s.Id==id);
            if (studentclasses == null)
            {
                return NotFound();
            }
            if (studentclasses.students?.ToList().Count() != 0)
                return BadRequest("the class must be without any student to delete it");
            if (studentclasses.teatcherstudents?.ToList().Count() != 0)
                return BadRequest("the class must be without any teacher to delete it");
            _context.studentclasses.Remove(studentclasses);
            _context.SaveChanges();
            return Ok(_context.studentclasses.Include(t => t.teatcherstudents).Include(s=>s.students).ToList());
        }

    }
}
