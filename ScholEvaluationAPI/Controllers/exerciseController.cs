using firstweb.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;
using ScholEvaluationAPI.Models.questiongroup;
using System.Security.Claims;

namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/exercise")]
    public class exerciseController : Controller
    {
        private readonly appdbcontext _context;
        private readonly ILogger<StudentController> _logger;
        public exerciseController(appdbcontext appdbcontext, ILogger<StudentController> logger)
        {
            _context = appdbcontext;
            _logger = logger;
        }
        [HttpGet]
        [Authorize(Roles = "Manager,Teacher,Student")]
        public IActionResult Get()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Alternative: Get specific custom claim
            var usercode = User.FindFirst(ClaimTypes.Name)?.Value;
            var usertype = User.FindFirst(ClaimTypes.Role)?.Value;
            if (usertype == "Student")
            {
                student student = _context.students.First(s=>s.id==Convert.ToInt16(userId));
                if (student == null)
                    return NotFound();
                IEnumerable<exercise> ex = _context.exercises
                .Include(e => e.subjects)
                .Include(e => e.paragraphs).ThenInclude(e => e.question)
                .Include(e => e.paragraphs).ThenInclude(e => e.qwrites)
                .Include(e => e.qwrites)
                .Include(e => e.question).Where(e=>e.classname==student.studentclass)
                .Where(e =>
                    e.type == "Class Assiment" || e.type == "Home Assiment" || e.type == "Evaluation " + student.group
                        )
                .ToList();
                return Ok(ex);
            }
            IEnumerable<exercise> exercise = _context.exercises
                .Include(e => e.subjects)
                .Include(e=>e.paragraphs).ThenInclude(e=>e.question)
                .Include(e=>e.paragraphs).ThenInclude(e=>e.qwrites)
                .Include(e=>e.qwrites)
                .Include(e => e.question)
                .ToList();
            return Ok(exercise);
        }
        [HttpGet]
        [Route("{id}")]
        public IActionResult Get(int id)
        {
            _context.chooses.ToList();
            exercise exercise = _context.exercises
                .Include(e=>e.subjects)
                .Include(e => e.paragraphs)
                .ThenInclude(e=>e.qwrites)
                .Include(e=>e.qwrites)
                .Include(e=>e.question)
                .FirstOrDefault(e=>e.id==id);
            if (exercise == null)
            {
                return NotFound();
            }
            var a = _context.qwrites.Where(w=>w.sqwrites==null);
            var b = _context.paragraphs.Include(e=>e.qwrites);
            return Ok(exercise);
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public IActionResult Post(exercise exercise)
        {
            subject subject = _context.subjects.Find(exercise.subjectid);
            if(subject == null)
            {
                return NotFound();
            }
            var a=_context.exercises.Where(a=>a.subjectid==exercise.subjectid).Where(a=>a.type==exercise.type)
                .Where(a=>a.classname==exercise.classname).Where(a=>a.evaluationNum==exercise.evaluationNum)
                .Where(a=>a.stage==exercise.stage);
            if(a.Any())
            {
                return NotFound("this exercise already exist");
            }
            if (ModelState.IsValid)
            {
                
                _context.exercises.Add(exercise);
                
                _context.SaveChanges();


                return Ok(exercise);
                
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpPut]
        [Route("{id}")]
        [Authorize(Roles = "Manager")]

        public IActionResult Put(int id, [FromBody] exercise model)
        {
            if (model.id != id)
            { return BadRequest("the data is not correct"); }
            exercise exercise=_context.exercises.Include(e=>e.question).Include(e=>e.qwrites).Include(e=>e.solveds).FirstOrDefault(e=>e.id==id);

            var a = _context.exercises.Where(a => a.subjectid == exercise.subjectid).Where(a => a.type == exercise.type)
    .Where(a => a.classname == exercise.classname).Where(a => a.evaluationNum == exercise.evaluationNum)
    .Where(a => a.stage == exercise.stage);
            if (a.Count() > 1)
            {
                return NotFound("this exercise already exist");
            }
            if (exercise==null)
            {
                return NotFound();
            }
            if (ModelState.IsValid)
            {
                if (exercise.solveds.Any())
                {
                    return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
                }
                exercise.type = model.type;
                exercise.stage = model.stage;
                exercise.subjectid = model.subjectid;
                exercise.classname = model.classname;
                exercise.evaluationNum = model.evaluationNum;
                if (model.question?.Count() != 0 && model.question != null)
                {
                    foreach (var i in model.question)
                    {
                        var c = exercise.question.FirstOrDefault(c=>c.id==i.id);
                        if (c == null)
                        { return BadRequest("one or more question  not found"); }
                        c.option1 = i.option1;
                        c.option2 = i.option2;
                        c.option3 = i.option3;
                        c.option4 = i.option4;
                        c.ask = i.ask;
                        c.answer = i.answer;
                    }
                }
                if (model.qwrites?.Count() != 0 && model.qwrites != null)
                {
                    foreach (var i in model.qwrites)
                    {
                        var c = exercise.qwrites.FirstOrDefault(c => c.id == i.id);
                        if (c == null)
                        { return BadRequest("one or more write question  not found"); }
                        c.title = i.title;
                        c.type = i.type;
                        c.Ask = i.Ask;
                        c.answerexample = i.answerexample;
                    }
                }
                _context.SaveChanges();
                return Ok(exercise);
            }
            else
            {
                return BadRequest(ModelState);
            }
        }
        [HttpDelete]
        [Authorize(Roles = "Manager")]
        [Route("{id}")]
        public IActionResult delete(int id)
        {
            var exercise = _context.exercises.Include(e => e.question).Include(e=>e.qwrites).Include(e=>e.paragraphs)
                .Include(s=>s.solveds).ThenInclude(s => s.question).Include(s => s.solveds).ThenInclude(s => s.sqwrites)
                .Include(s => s.solveds).ThenInclude(s => s.paragraphs).ThenInclude(p => p.solvedquestion)
                .Include(s => s.solveds).ThenInclude(s => s.paragraphs).ThenInclude(p => p.sqwrites)
                .FirstOrDefault(e => e.id == id);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            foreach (var item in exercise.solveds)
            {
                item.question?.Clear();
                item.sqwrites?.Clear();
                foreach (var item1 in item.paragraphs)
                {
                    item1.solvedquestion?.Clear();
                    item1.sqwrites?.Clear();
                }
                item.paragraphs?.Clear();
            }
            exercise.solveds?.Clear();
            exercise.qwrites?.Clear();
            exercise.question?.Clear();
            foreach (var item in exercise.paragraphs)
            {
                item.qwrites?.Clear();
                item.question?.Clear();
            }
            exercise.paragraphs?.Clear();
            _context.exercises.Remove(exercise);
            _context.SaveChanges();
            ICollection<exercise> e = _context.exercises.Include(e => e.question).ToList();
            return Ok(e);
        }
        [HttpDelete]
        [Authorize(Roles = "Manager")]
        [Route("question")]
        public IActionResult deletequestion(transportdata data)
        {
            
            exercise exercise = _context.exercises.Include(e => e.question).Include(e => e.solveds).FirstOrDefault(e=>e.id==data.id);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            choose choose= exercise.question.FirstOrDefault(e => e.id == data.number);
            if (choose == null)
            {
                return NotFound("the question not found");
            }
            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            _context.chooses.Remove(choose);
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("question")]
        public IActionResult addquestion(choose choose)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (choose.exerciseid == 0)
            {
                return BadRequest("exercise must not be null or 0");
            }
            exercise exercise = _context.exercises
                .Include(e => e.question)
                .Include(e => e.solveds)
                .FirstOrDefault(e => e.id == choose.exerciseid);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            exercise.question ??= new List<choose>();
            exercise.question.Add(choose);
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("paragraph")]
        public IActionResult addparagraph(paragraph paragraph)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (paragraph.exerciseid == 0)
            {
                return BadRequest("exercise must not be null or 0");
            }
            exercise exercise = _context.exercises.Include(e => e.question).Include(e=>e.solveds).Include(e=>e.paragraphs).FirstOrDefault(e => e.id == paragraph.exerciseid);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            exercise?.paragraphs?.Add(paragraph);
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpDelete]
        [Authorize(Roles = "Manager")]
        [Route("paragraph")]
        public IActionResult removeparagraph(transportdata transportdata)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (transportdata.id == 0)
            {
                return BadRequest("exercise must not be null or 0");
            }
            exercise exercise = _context.exercises.Include(e=>e.solveds)
                .Include(e=>e.paragraphs).ThenInclude(e=>e.question)
                .Include(e => e.paragraphs).ThenInclude(e => e.qwrites)
                .FirstOrDefault(e => e.id == transportdata.id);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            var paragraph=exercise?.paragraphs.FirstOrDefault(e=>e.id==transportdata.number);
            if (paragraph == null)
            {
                return NotFound("paragrapg not found");
            }
            paragraph.question.Clear();
            paragraph.qwrites.Clear();

            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            _context.SaveChanges();
            _context.paragraphs.Remove(paragraph);
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpPost]
        [Authorize(Roles = "Manager")]
        [Route("qwrite")]
        public IActionResult addqwrite(qwrite qwrite)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (qwrite.exerciseid == 0)
            {
                return BadRequest("exercise must not be null or 0");
            }
            exercise exercise = _context.exercises.Include(e=>e.qwrites).Include(e=>e.solveds).FirstOrDefault(e => e.id == qwrite.exerciseid);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            exercise?.qwrites?.Add(qwrite);
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpDelete]
        [Authorize(Roles = "Manager")]
        [Route("qwrite")]
        public IActionResult removeqwrite(transportdata transportdata)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (transportdata.id == 0)
            {
                return BadRequest("exercise must not be null or 0");
            }
            exercise exercise = _context.exercises.Include(e => e.qwrites).Include(e => e.solveds).FirstOrDefault(e => e.id == transportdata.id);
            if (exercise == null)
            {
                return NotFound("the exercise not found");
            }
            var qwirt = exercise?.qwrites.FirstOrDefault(e => e.id == transportdata.number);
            if (qwirt == null)
            {
                return NotFound("paragrapg not found");
            }
            exercise.qwrites.Clear();
            if (exercise.solveds?.Any() == true)
            {
                return BadRequest("this exercise cann't edit becouse there is one or more solve this exercise ,please delete the exercise then add it again.");
            }
            _context.SaveChanges();
            return Ok(exercise);
        }
        [HttpPost]
        [Authorize(Roles = "Student")]
        [Route("send")]
        public IActionResult solveExercise([FromBody] solvedexercise solvedexercise)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            exercise exercise = _context.exercises
                .Include(e=>e.qwrites)
                .Include(e => e.question)
                .Include(e => e.paragraphs).ThenInclude(e=>e.question)
                .Include(e => e.paragraphs).ThenInclude(e => e.qwrites)
                .FirstOrDefault(e => e.id == solvedexercise.exerciseid);
            if (exercise == null)
                return NotFound("the exercise not found");
            student student = _context.students.Include(e=>e.solvedexercises).FirstOrDefault(s => s.id == solvedexercise.studentid);
            if (student == null)
                return NotFound("the student not found");
            if (student.authority != exercise.id.ToString() || student.closetime < DateTime.Now)
            {
                return BadRequest("you are not allowed to solve this exercise");
            }
            if (student.solvedexercises.FirstOrDefault(e => e.exerciseid == exercise.id) != null)
            {
                return BadRequest($"this student({student.name}) already has solved this exercise");
            }
            solvedexercise.senddate = DateTime.Now;
            solvedexercise.type = exercise.type;
            if (solvedexercise.question?.Count() != exercise.question?.Count() ||
               solvedexercise.sqwrites?.Count() != exercise.qwrites?.Count() ||
               solvedexercise.paragraphs?.Count() != exercise.paragraphs?.Count())
            {
                _logger.LogInformation($"questionNum in solved:{solvedexercise.question?.Count()}," +
                    $"in exercise:{exercise.question?.Count()}");
                return BadRequest(solvedexercise);
            }
            int totaldegree = (solvedexercise.question?.Count()??0)+
                (solvedexercise.sqwrites?.Sum(e => e.totaldegree)??0)+

                (solvedexercise.paragraphs?.Sum(e=>e.sqwrites?.Sum(e=>e.totaldegree))??0)+

                (solvedexercise.paragraphs?.Sum(e=>e.solvedquestion?.Count())??0);

            int correctdegree = (solvedexercise.question?.Where(e => e.IsCorrect).Count() ?? 0) +
                (solvedexercise.sqwrites?.Sum(e => e.correctdegree ?? 0) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.solvedquestion?.Where(e => e.IsCorrect == true)?.Count()) ?? 0) +
                (solvedexercise.paragraphs?.Sum(e => e.sqwrites?.Sum(e => e.correctdegree) ?? 0) ?? 0)
                ;
            solvedexercise.totalanswer = totaldegree;
            solvedexercise.correctanswer= correctdegree;
            _context.Solvedexercise.Add(solvedexercise);
            _context.SaveChanges();
            return Ok(solvedexercise);




        }
    }
}
