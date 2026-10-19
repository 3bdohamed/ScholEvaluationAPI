using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace firstweb.Models
{
    /*
    Plan (pseudocode, step-by-step):
    1. Rename the class from lower-case `solvedchoose` to `SolvedChoose` to avoid CS8981 (reserve rule).
    2. Convert property names to PascalCase to follow C# naming conventions and project standards.
    3. Ensure non-nullable reference properties are initialized to silence CS8618 by using the null-forgiving initializer (`= null!`).
       - This keeps them non-nullable for intent but avoids needing a constructor.
    4. Make foreign key properties nullable (`int?`) so EF Core treats those relationships as optional,
       which prevents generation of cascading DELETE SQL that can produce "multiple cascade paths" errors.
    5. Update `[ForeignKey]` attributes to reference the navigation property names using `nameof(...)`.
    6. Implement `IsCorrect` as a computed boolean using a null-safe comparison.
    7. Keep `[Required]` on `Id` (primary key) if desired; EF will treat `Id` as the PK by convention.
    8. This single model change avoids altering DbContext and prevents cascade delete DDL that caused the SQL Server error.
    */

    public class SolvedChoose
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Ask { get; set; } = null!;

        [Required]
        public string Option1 { get; set; } = null!;

        [Required]
        public string Option2 { get; set; } = null!;

        [Required]
        public string Option3 { get; set; } = null!;

        [Required]
        public string Option4 { get; set; } = null!;

        [Required]
        [AllowedValues(["1", "2", "3", "4"], ErrorMessage = "this value isn't allowed,the allowed values is[\"1\",\"2\", \"3\", \"4\"]")]
        public string Answer { get; set; } = null!;
        [AllowedValues(["1","2", "3", "4",null],ErrorMessage = "this value isn't allowed,the allowed values is[\"1\",\"2\", \"3\", \"4\",null]")]

        public string Choiced { get; set; } = null!;

        public bool IsCorrect => string.Equals(Answer, Choiced, StringComparison.Ordinal);

        // Make FKs nullable to avoid required cascading deletes (prevents multiple cascade paths error)
        [ForeignKey(nameof(SolvedExercise))]
        public int? SolvedExerciseId { get; set; }
        public solvedexercise? SolvedExercise { get; set; }

        [ForeignKey(nameof(Choose))]
        public int? ChooseId { get; set; }
        public choose? Choose { get; set; }
    }
}
