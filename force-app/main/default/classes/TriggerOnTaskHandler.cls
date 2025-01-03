public class TriggerOnTaskHandler {
    List<Task> taskList;
    
    public TriggerOnTaskHandler(List<Task> taskList)
    {
        this.taskList = taskList;
    }
    
    public void beforeInsert()
    {
        TriggerOnTaskService.provideAccessToAllUsers(this.taskList);
    }
}