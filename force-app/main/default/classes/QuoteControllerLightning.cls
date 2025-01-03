public class QuoteControllerLightning{
      //Define the Project Object
      zqu__Quote__c theQuote = new zqu__Quote__c();  
      String theQuoteID;
      String theAccountID,theBillToContact,theSoldToContact;
      String theURL;
       
      // Constructor - this only really matters if the autoRun function doesn't work right    
      public QuoteControllerLightning(ApexPages.StandardController stdController) {       
          this.theQuote =(zqu__Quote__c)stdController.getRecord();    
      }
       
      // Code invoked on page load.     
      public PageReference autoRun()
      {          
          String thePageQuoteId =ApexPages.currentPage().getParameters().get('id');
          if (thePageQuoteId == null)
          {            
              // Display the Visualforce page's error message if no Id is passed over            
              return null;        
          }      
         
      for (zqu__Quote__c theQuote :[select Id, zqu__Account__c,zqu__SoldToContact__c from zqu__Quote__c  where id=:thePageQuoteId Limit 1])
      {
          theQuoteID = theQuote.Id;
          theAccountID = theQuote.zqu__Account__c;
          Contact contactDetails=[Select Email,FirstName,LastName From Contact Where id=:theQuote.zqu__SoldToContact__c];
          String CRL='Email~'+contactDetails.Email+';Role~Signer 1;FirstName~'+contactDetails.FirstName+';LastName~'+contactDetails.LastName+';RoutingOrder~1,Email~sales@dakota.network;FirstName~William G;LastName~Costin;RoutingOrder~2';
         TheURL='https://dakotanetworks.my.salesforce.com/apex/dsfs__DocuSign_CreateEnvelope?DSEID=0&SourceID='+theQuoteID+'&CRL='+CRL+'&LA=1';
      } 
         
      // Redirect the user to where ever you want to go.
      PageReference pageRef = new PageReference(TheURL);        
      pageRef.setRedirect(true);   
      return pageRef;   
      }
  }