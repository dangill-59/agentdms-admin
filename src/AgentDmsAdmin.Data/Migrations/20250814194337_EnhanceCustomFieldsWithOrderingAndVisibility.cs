using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgentDmsAdmin.Data.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceCustomFieldsWithOrderingAndVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRemovable",
                table: "CustomFields",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "CustomFields",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RoleVisibility",
                table: "CustomFields",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserListOptions",
                table: "CustomFields",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRemovable",
                table: "CustomFields");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "CustomFields");

            migrationBuilder.DropColumn(
                name: "RoleVisibility",
                table: "CustomFields");

            migrationBuilder.DropColumn(
                name: "UserListOptions",
                table: "CustomFields");
        }
    }
}
