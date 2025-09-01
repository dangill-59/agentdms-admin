using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgentDmsAdmin.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleFieldValueRestrictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoleFieldValueRestrictions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomFieldId = table.Column<int>(type: "INTEGER", nullable: false),
                    Values = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    IsAllowList = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleFieldValueRestrictions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleFieldValueRestrictions_CustomFields_CustomFieldId",
                        column: x => x.CustomFieldId,
                        principalTable: "CustomFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoleFieldValueRestrictions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleFieldValueRestrictions_CustomFieldId",
                table: "RoleFieldValueRestrictions",
                column: "CustomFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleFieldValueRestrictions_RoleId_CustomFieldId",
                table: "RoleFieldValueRestrictions",
                columns: new[] { "RoleId", "CustomFieldId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoleFieldValueRestrictions");
        }
    }
}
