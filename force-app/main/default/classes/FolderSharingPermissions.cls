global with sharing class FolderSharingPermissions implements Schedulable {
   /**
    * DSC-373 : Reports Folder Default Sharing for Internal Users
    * Scheduler to update folder permissions in batches of 50
    */
   global void execute(SchedulableContext sc) {
      BatchFolderSharingPermissions b = new BatchFolderSharingPermissions(); 
      Database.executebatch(b,50);
   }
}