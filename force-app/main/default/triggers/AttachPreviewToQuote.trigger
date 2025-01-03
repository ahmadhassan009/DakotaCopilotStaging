trigger AttachPreviewToQuote on Attachment (after insert) {
    for (Attachment attach : Trigger.New) {    
        if(attach.ParentId.getSobjectType() == Opportunity.SobjectType){    
            String quoteName = attach.Name.substring(0,attach.Name.length()-12);
            List<zqu__Quote__c> quotes = [SELECT id,name FROM zqu__Quote__c WHERE name =: quoteName AND zqu__Opportunity__c=:attach.ParentId];
            for(zqu__Quote__c quote : quotes){
                Attachment b = new Attachment();
                b.name = quote.name+'_preview.pdf';
                b.body = attach.body;
                b.ParentId = quote.Id;
                insert(b);
            }
        }
    }
}