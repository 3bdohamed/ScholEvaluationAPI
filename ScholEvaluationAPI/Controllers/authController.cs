using firstweb.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ScholEvaluationAPI.Data;
using ScholEvaluationAPI.Models;
using ScholEvaluationAPI.Models.other;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
namespace ScholEvaluationAPI.Controllers
{
    [ApiController]
    [Route("api/authentication")]
    public class authController : Controller
    {
        private readonly ILogger<authController> _logger;
        private readonly appdbcontext _context;
        private readonly IConfiguration _configuration;
        public authController(ILogger<authController> logger, appdbcontext context, IConfiguration configuration)
        {
            _logger = logger;
            _context = context;
            _configuration = configuration;
        }
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> login([FromBody] transportdata data)
        {
            var manager = await _context.Manegars.FirstOrDefaultAsync(m => m.Name == data.name);
            if (manager == null)
                return Unauthorized(new { Message = "the data is not correct" });
            var passwordh = new PasswordHasher<Manegar>();
            var result = passwordh.VerifyHashedPassword(manager, manager.Password, data.password);
            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { massege = "the pasword is not correct" });
            }
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier,manager.ID.ToString()),
                new Claim(ClaimTypes.Name,manager.Name),
                new Claim(ClaimTypes.Role,"Manager")
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(3),
                signingCredentials: cred

                );
            _logger.LogInformation(_configuration["Jwt:Key"] + _configuration["Jwt:Issuer"] + _configuration["Jwt:Audience"]);
            var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);
            return Ok(new
            {
                token = jwtToken,
                expiration = token.ValidTo

            });
        }
        [HttpPost]
        [Route("login/teacher")]
        public async Task<IActionResult> LoginTeacher([FromBody] transportdata data)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.teatchercode == data.name);
            if (teacher == null)
                return Unauthorized(new { Message = "Invalid credentials" });

            var passwordh = new PasswordHasher<teacher>();
            var result = passwordh.VerifyHashedPassword(teacher, teacher.password, data.password);
            //if (result == PasswordVerificationResult.Failed)
            if(teacher.password != data.password)
                return Unauthorized(new { Message = "Invalid password" });

            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, teacher.id.ToString()),
        new Claim(ClaimTypes.Name, teacher.teatchercode),
        new Claim(ClaimTypes.Role, "Teacher")
    };

            var token = GenerateToken(claims);
            return Ok(new { token = token.token, expiration = token.expiration });
        }

        [HttpPost]
        [Route("login/student")]
        public async Task<IActionResult> LoginStudent([FromBody] transportdata data)
        {
            var student = await _context.students.FirstOrDefaultAsync(s => s.studentcode == data.name);
            if (student == null)
                return Unauthorized(new { Message = "Invalid credentials" });

            var passwordh = new PasswordHasher<student>();
            var result = passwordh.VerifyHashedPassword(student, student.password, data.password);
            if (student.password!=data.password)
                return Unauthorized(new { Message = "Invalid password" });

            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, student.id.ToString()),
        new Claim(ClaimTypes.Name, student.studentcode),
        new Claim(ClaimTypes.Role, "Student")
    };

            var token = GenerateToken(claims);
            return Ok(new { token = token.token, expiration = token.expiration });
        }

        private (string token, DateTime expiration) GenerateToken(Claim[] claims)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var cred = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var jwtToken = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(3),
                signingCredentials: cred);

            return (new JwtSecurityTokenHandler().WriteToken(jwtToken), jwtToken.ValidTo);
        }
    }
}
