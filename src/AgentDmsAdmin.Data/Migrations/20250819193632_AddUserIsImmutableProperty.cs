using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgentDmsAdmin.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIsImmutableProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsImmutable",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsImmutable",
                table: "Users");
        }
    }
}
