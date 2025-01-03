@RestResource(urlMapping='/DakotaCustomCalculateQuote')
global with sharing class DakotaCustomCalculateQuote {
   
    @HttpPost
    global static void PopulateQuoteMetrics(String quoteId)
    {
        // Recalculate Quote metrics manually.
        zqu.zQuoteUtil.ZBillingResult previewResult = zqu.QuoteRecalculateController.JR_recalculate(quoteId);
    }
}