using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AgentDmsAdmin.Data.Data;

public class AgentDmsContextFactory : IDesignTimeDbContextFactory<AgentDmsContext>
{
    public AgentDmsContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AgentDmsContext>();
        optionsBuilder.UseSqlite("Data Source=agentdms_design.db");

        return new AgentDmsContext(optionsBuilder.Options);
    }
}