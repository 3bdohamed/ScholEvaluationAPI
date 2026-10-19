using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScholEvaluationAPI.Migrations
{
    /// <inheritdoc />
    public partial class v : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Manegars",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false),
                    addteacher = table.Column<bool>(type: "INTEGER", nullable: false),
                    addstudent = table.Column<bool>(type: "INTEGER", nullable: false),
                    linkteachertostudent = table.Column<bool>(type: "INTEGER", nullable: false),
                    addexercise = table.Column<bool>(type: "INTEGER", nullable: false),
                    addsubject = table.Column<bool>(type: "INTEGER", nullable: false),
                    isOnlyManegar = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Manegars", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "studentclasses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    stage = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_studentclasses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "subjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubjectName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "students",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    studentcode = table.Column<string>(type: "TEXT", nullable: false),
                    password = table.Column<string>(type: "TEXT", nullable: false),
                    studentclass = table.Column<string>(type: "TEXT", nullable: false),
                    group = table.Column<string>(type: "TEXT", nullable: false),
                    authority = table.Column<string>(type: "TEXT", nullable: true),
                    create_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    authorityDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    studentclassesId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_students", x => x.id);
                    table.ForeignKey(
                        name: "FK_students_studentclasses_studentclassesId",
                        column: x => x.studentclassesId,
                        principalTable: "studentclasses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "exercises",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    stage = table.Column<string>(type: "TEXT", nullable: false),
                    classname = table.Column<string>(type: "TEXT", nullable: false),
                    subjectid = table.Column<int>(type: "INTEGER", nullable: false),
                    evaluationNum = table.Column<string>(type: "TEXT", nullable: true),
                    type = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercises", x => x.id);
                    table.ForeignKey(
                        name: "FK_exercises_subjects_subjectid",
                        column: x => x.subjectid,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Teachers",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    firstname = table.Column<string>(type: "TEXT", nullable: false),
                    teatchercode = table.Column<string>(type: "TEXT", nullable: false),
                    lastname = table.Column<string>(type: "TEXT", nullable: false),
                    subjectid = table.Column<int>(type: "INTEGER", nullable: false),
                    goverment = table.Column<string>(type: "TEXT", nullable: false),
                    schoolname = table.Column<string>(type: "TEXT", nullable: false),
                    password = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teachers", x => x.id);
                    table.ForeignKey(
                        name: "FK_Teachers_subjects_subjectid",
                        column: x => x.subjectid,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "paragraphs",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    title = table.Column<string>(type: "TEXT", nullable: false),
                    paragraphbody = table.Column<string>(type: "TEXT", nullable: false),
                    exerciseid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_paragraphs", x => x.id);
                    table.ForeignKey(
                        name: "FK_paragraphs_exercises_exerciseid",
                        column: x => x.exerciseid,
                        principalTable: "exercises",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Solvedexercise",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    exerciseid = table.Column<int>(type: "INTEGER", nullable: false),
                    correctanswer = table.Column<int>(type: "INTEGER", nullable: false),
                    totalanswer = table.Column<int>(type: "INTEGER", nullable: false),
                    studentid = table.Column<int>(type: "INTEGER", nullable: false),
                    type = table.Column<string>(type: "TEXT", nullable: false),
                    iscorrected = table.Column<bool>(type: "INTEGER", nullable: true),
                    senddate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Solvedexercise", x => x.id);
                    table.ForeignKey(
                        name: "FK_Solvedexercise_exercises_exerciseid",
                        column: x => x.exerciseid,
                        principalTable: "exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Solvedexercise_students_studentid",
                        column: x => x.studentid,
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Teatcherstudents",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    teacherId = table.Column<int>(type: "INTEGER", nullable: false),
                    teachercode = table.Column<string>(type: "TEXT", nullable: false),
                    studentclassid = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teatcherstudents", x => x.id);
                    table.ForeignKey(
                        name: "FK_Teatcherstudents_Teachers_teacherId",
                        column: x => x.teacherId,
                        principalTable: "Teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Teatcherstudents_studentclasses_studentclassid",
                        column: x => x.studentclassid,
                        principalTable: "studentclasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chooses",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ask = table.Column<string>(type: "TEXT", nullable: false),
                    option1 = table.Column<string>(type: "TEXT", nullable: false),
                    option2 = table.Column<string>(type: "TEXT", nullable: false),
                    option3 = table.Column<string>(type: "TEXT", nullable: false),
                    option4 = table.Column<string>(type: "TEXT", nullable: false),
                    answer = table.Column<string>(type: "TEXT", nullable: false),
                    exerciseid = table.Column<int>(type: "INTEGER", nullable: true),
                    paragraphid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chooses", x => x.id);
                    table.ForeignKey(
                        name: "FK_chooses_exercises_exerciseid",
                        column: x => x.exerciseid,
                        principalTable: "exercises",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_chooses_paragraphs_paragraphid",
                        column: x => x.paragraphid,
                        principalTable: "paragraphs",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "qwrites",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Ask = table.Column<string>(type: "TEXT", nullable: false),
                    type = table.Column<string>(type: "TEXT", nullable: false),
                    title = table.Column<string>(type: "TEXT", nullable: true),
                    answerexample = table.Column<string>(type: "TEXT", nullable: false),
                    justifyanswer = table.Column<bool>(type: "INTEGER", nullable: true),
                    degrees = table.Column<int>(type: "INTEGER", nullable: true),
                    exerciseid = table.Column<int>(type: "INTEGER", nullable: true),
                    paragraphid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_qwrites", x => x.id);
                    table.ForeignKey(
                        name: "FK_qwrites_exercises_exerciseid",
                        column: x => x.exerciseid,
                        principalTable: "exercises",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_qwrites_paragraphs_paragraphid",
                        column: x => x.paragraphid,
                        principalTable: "paragraphs",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sparagraph",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    paragraphid = table.Column<int>(type: "INTEGER", nullable: false),
                    solvedexerciseid = table.Column<int>(type: "INTEGER", nullable: true),
                    totaldegree = table.Column<int>(type: "INTEGER", nullable: false),
                    correctdegree = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sparagraph", x => x.id);
                    table.ForeignKey(
                        name: "FK_sparagraph_Solvedexercise_solvedexerciseid",
                        column: x => x.solvedexerciseid,
                        principalTable: "Solvedexercise",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_sparagraph_paragraphs_paragraphid",
                        column: x => x.paragraphid,
                        principalTable: "paragraphs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Solvedchooses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Ask = table.Column<string>(type: "TEXT", nullable: false),
                    Option1 = table.Column<string>(type: "TEXT", nullable: false),
                    Option2 = table.Column<string>(type: "TEXT", nullable: false),
                    Option3 = table.Column<string>(type: "TEXT", nullable: false),
                    Option4 = table.Column<string>(type: "TEXT", nullable: false),
                    Answer = table.Column<string>(type: "TEXT", nullable: false),
                    Choiced = table.Column<string>(type: "TEXT", nullable: false),
                    SolvedExerciseId = table.Column<int>(type: "INTEGER", nullable: true),
                    ChooseId = table.Column<int>(type: "INTEGER", nullable: true),
                    sparagraphid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Solvedchooses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Solvedchooses_Solvedexercise_SolvedExerciseId",
                        column: x => x.SolvedExerciseId,
                        principalTable: "Solvedexercise",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_Solvedchooses_chooses_ChooseId",
                        column: x => x.ChooseId,
                        principalTable: "chooses",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_Solvedchooses_sparagraph_sparagraphid",
                        column: x => x.sparagraphid,
                        principalTable: "sparagraph",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "solvedqwrites",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    answer = table.Column<string>(type: "TEXT", nullable: false),
                    totaldegree = table.Column<int>(type: "INTEGER", nullable: true),
                    correctdegree = table.Column<int>(type: "INTEGER", nullable: true),
                    qweiteid = table.Column<int>(type: "INTEGER", nullable: false),
                    solvedexerciseid = table.Column<int>(type: "INTEGER", nullable: true),
                    sparagraphid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_solvedqwrites", x => x.id);
                    table.ForeignKey(
                        name: "FK_solvedqwrites_Solvedexercise_solvedexerciseid",
                        column: x => x.solvedexerciseid,
                        principalTable: "Solvedexercise",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_solvedqwrites_qwrites_qweiteid",
                        column: x => x.qweiteid,
                        principalTable: "qwrites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_solvedqwrites_sparagraph_sparagraphid",
                        column: x => x.sparagraphid,
                        principalTable: "sparagraph",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_chooses_exerciseid",
                table: "chooses",
                column: "exerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_chooses_paragraphid",
                table: "chooses",
                column: "paragraphid");

            migrationBuilder.CreateIndex(
                name: "IX_exercises_subjectid",
                table: "exercises",
                column: "subjectid");

            migrationBuilder.CreateIndex(
                name: "IX_Manegars_isOnlyManegar",
                table: "Manegars",
                column: "isOnlyManegar",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_paragraphs_exerciseid",
                table: "paragraphs",
                column: "exerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_qwrites_exerciseid",
                table: "qwrites",
                column: "exerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_qwrites_paragraphid",
                table: "qwrites",
                column: "paragraphid");

            migrationBuilder.CreateIndex(
                name: "IX_Solvedchooses_ChooseId",
                table: "Solvedchooses",
                column: "ChooseId");

            migrationBuilder.CreateIndex(
                name: "IX_Solvedchooses_SolvedExerciseId",
                table: "Solvedchooses",
                column: "SolvedExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_Solvedchooses_sparagraphid",
                table: "Solvedchooses",
                column: "sparagraphid");

            migrationBuilder.CreateIndex(
                name: "IX_Solvedexercise_exerciseid",
                table: "Solvedexercise",
                column: "exerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_Solvedexercise_studentid",
                table: "Solvedexercise",
                column: "studentid");

            migrationBuilder.CreateIndex(
                name: "IX_solvedqwrites_qweiteid",
                table: "solvedqwrites",
                column: "qweiteid");

            migrationBuilder.CreateIndex(
                name: "IX_solvedqwrites_solvedexerciseid",
                table: "solvedqwrites",
                column: "solvedexerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_solvedqwrites_sparagraphid",
                table: "solvedqwrites",
                column: "sparagraphid");

            migrationBuilder.CreateIndex(
                name: "IX_sparagraph_paragraphid",
                table: "sparagraph",
                column: "paragraphid");

            migrationBuilder.CreateIndex(
                name: "IX_sparagraph_solvedexerciseid",
                table: "sparagraph",
                column: "solvedexerciseid");

            migrationBuilder.CreateIndex(
                name: "IX_students_studentclassesId",
                table: "students",
                column: "studentclassesId");

            migrationBuilder.CreateIndex(
                name: "IX_students_studentcode",
                table: "students",
                column: "studentcode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_subjectid",
                table: "Teachers",
                column: "subjectid");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_teatchercode",
                table: "Teachers",
                column: "teatchercode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teatcherstudents_studentclassid",
                table: "Teatcherstudents",
                column: "studentclassid");

            migrationBuilder.CreateIndex(
                name: "IX_Teatcherstudents_teacherId",
                table: "Teatcherstudents",
                column: "teacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Manegars");

            migrationBuilder.DropTable(
                name: "Solvedchooses");

            migrationBuilder.DropTable(
                name: "solvedqwrites");

            migrationBuilder.DropTable(
                name: "Teatcherstudents");

            migrationBuilder.DropTable(
                name: "chooses");

            migrationBuilder.DropTable(
                name: "qwrites");

            migrationBuilder.DropTable(
                name: "sparagraph");

            migrationBuilder.DropTable(
                name: "Teachers");

            migrationBuilder.DropTable(
                name: "Solvedexercise");

            migrationBuilder.DropTable(
                name: "paragraphs");

            migrationBuilder.DropTable(
                name: "students");

            migrationBuilder.DropTable(
                name: "exercises");

            migrationBuilder.DropTable(
                name: "studentclasses");

            migrationBuilder.DropTable(
                name: "subjects");
        }
    }
}
