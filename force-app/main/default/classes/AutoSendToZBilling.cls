global class AutoSendToZBilling
{
   public static void sendQuote(String quoteId , String billAccId)
   {
      try
      {
         final Map<String, String> finalRes = zqu.zQuoteUtil.sendToZBilling(quoteId ,billAccId,false, null, null);
          
         String resultString = '';
         for (String result : finalRes.values()) 
         { resultString += result; 
         System.debug('Result:'+result);
         }
         System.debug('AutoSendQuote Result' +resultString);
      } 
       catch(Exception e)
       { System.debug('Exception in Sending Quote' + e.getMessage()); }

   }
   @future (callout=true)
    public static void sendQuotesToZuora(String qid,String bid) {
    sendQuote(qid,bid);
    }
 
}