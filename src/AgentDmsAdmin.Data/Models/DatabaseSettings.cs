namespace AgentDmsAdmin.Data.Models;

public class DatabaseSettings
{
    public string Type { get; set; } = "sqlite"; // sqlite, postgresql, mysql, sqlserver, mongodb
    public string Host { get; set; } = "";
    public int Port { get; set; } = 0;
    public string DatabaseName { get; set; } = "agentdms";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string ConnectionString { get; set; } = "Data Source=agentdms.db";
    public DatabaseAdvancedSettings Advanced { get; set; } = new();
}

public class DatabaseAdvancedSettings
{
    public bool EnableSsl { get; set; } = false;
    public int ConnectionTimeout { get; set; } = 30; // seconds
    public int CommandTimeout { get; set; } = 30; // seconds
    public int MaxPoolSize { get; set; } = 100;
    public int MinPoolSize { get; set; } = 0;
    public bool EnableConnectionPooling { get; set; } = true;
    public string AdditionalOptions { get; set; } = "";
}