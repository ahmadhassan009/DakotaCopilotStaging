public with sharing class FormDWarapper {
    public total total;
	public List<offerings> offerings;
	public class total {
		public Integer value;	//10000
		public String relation;	//gte
	}
	public class offerings {
		public String id;	//579daeabaea55b35981ab44de7183d75
		public String accessionNo;	//0001949976-22-000001
		public String filedAt;	//2022-10-12T09:08:37-04:00
		public String submissionType;	//D
        public String schemaVersion;	//X0708
		public String testOrLive;	//LIVE
		public primaryIssuer primaryIssuer;
		public relatedPersonsList relatedPersonsList;
		public offeringData offeringData;
	}
	public class primaryIssuer {
		public String cik;	//0001949976
		public String entityName;	//O2 SIB Co-Investors, LLC
		public issuerAddress issuerAddress;
		public String issuerPhoneNumber;	//248-554-4227
		public String jurisdictionOfInc;	//DELAWARE
		public issuerPreviousNameList[] issuerPreviousNameList;
		public edgarPreviousNameList[] edgarPreviousNameList;
		public String entityType;	//Limited Liability Company
		public yearOfInc yearOfInc;
	}
	public class issuerAddress {
		public String street1;	//40900 WOODWARD AVENUE
		public String street2;	//SUITE 200
		public String city;	//BLOOMFIELD HILLS
		public String stateOrCountry;	//MI
		public String stateOrCountryDescription;	//MICHIGAN
		public String zipCode;	//48304
	}
	public class issuerPreviousNameList {
		public String value;	//None
	}
	public class edgarPreviousNameList {
		public String value;	//None
	}
	public class yearOfInc {
		public boolean withinFiveYears;
		public String value;	//2022
	}
	public class relatedPersonsList {
		public relatedPersonInfo[] relatedPersonInfo;
	}
	public class relatedPersonInfo {
		public relatedPersonName relatedPersonName;
		public relatedPersonAddress relatedPersonAddress;
		public relatedPersonRelationshipList relatedPersonRelationshipList;
		public String relationshipClarification;
	}
	public class relatedPersonName {
		public String firstName;	//Patrick
		public String middleName;	//R.
		public String lastName;	//Corden
	}
	public class relatedPersonAddress {
		public String street1;	//40900 Woodward Avenue, Suite 200
		public String street2;
		public String city;	//Bloomfield Hills
		public String stateOrCountry;	//MI
		public String stateOrCountryDescription;	//MICHIGAN
		public String zipCode;	//48304
	}
	public class relatedPersonRelationshipList {
		public List<String> relationship;
	}
	public class offeringData {
		public industryGroup industryGroup;
		public issuerSize issuerSize;
		public federalExemptionsExclusions federalExemptionsExclusions;
		public typeOfFiling typeOfFiling;
		public durationOfOffering durationOfOffering;
		public typesOfSecuritiesOffered typesOfSecuritiesOffered;
		public businessCombinationTransaction businessCombinationTransaction;
		public Long minimumInvestmentAccepted;	//0
		public salesCompensationList salesCompensationList;
		public offeringSalesAmounts offeringSalesAmounts;
		public investors investors;
		public salesCommissionsFindersFees salesCommissionsFindersFees;
		public useOfProceeds useOfProceeds;
		public signatureBlock signatureBlock;
	}
	public class industryGroup {
		public String industryGroupType;	//Pooled Investment Fund
		public investmentFundInfo investmentFundInfo;
	}
	public class investmentFundInfo {
		public String investmentFundType;	//Private Equity Fund
		public boolean is40Act;
	}
	public class issuerSize {
		public String revenueRange;	//Decline to Disclose
		public String aggregateNetAssetValueRange;	
	}
	public class federalExemptionsExclusions {
		public List<String> item;
	}
	public class typeOfFiling {
		public newOrAmendment newOrAmendment;
		public dateOfFirstSale dateOfFirstSale;
	}
	public class newOrAmendment {
		public boolean isAmendment;
		public String previousAccessionNumber;
	}
	public class dateOfFirstSale {
		public String value;	//2022-09-30
		public boolean yetToOccur;
	}
	public class durationOfOffering {
		public boolean moreThanOneYear;
	}
	public class typesOfSecuritiesOffered {
		public boolean isEquityType;
		public boolean isDebtType;
		public boolean isOptionToAcquireType;
		public boolean isSecurityToBeAcquiredType;
		public boolean isPooledInvestmentFundType;
		public boolean isTenantInCommonType;
		public boolean isMineralPropertyType;
		public boolean isOtherType;
		public String descriptionOfOtherType;
	}
	public class businessCombinationTransaction {
		public boolean isBusinessCombinationTransaction;
		public String clarificationOfResponse;
	}
	public class salesCompensationList {
		public List<Recipient> recipient;
	}
	public class Recipient {
		public String recipientName;
		public String recipientCRDNumber;
		public String associatedBDName;
		public String associatedBDCRDNumber;
		public RelatedPersonAddress recipientAddress;
		public List<StatesOfSolicitationList> statesOfSolicitationList;
		public Boolean foreignSolicitation;
	}
	public class StatesOfSolicitationList {
		public String state;
		public String description;
		public String value;
	}
	public class offeringSalesAmounts {
		public Long totalOfferingAmount;	//25000000
		public Long totalAmountSold;	//25000000
		public Long totalRemaining;	//0
		public String clarificationOfResponse;
	}
	public class investors {
		public boolean hasNonAccreditedInvestors;
		public Integer numberNonAccreditedInvestors;
		public Integer totalNumberAlreadyInvested;	//2
	}
	public class salesCommissionsFindersFees {
		public salesCommissions salesCommissions;
		public findersFees findersFees;
		public String clarificationOfResponse;
	}
	public class salesCommissions {
		public Long dollarAmount;	//0
		public Boolean isEstimate;
	}
	public class findersFees {
		public Long dollarAmount;	//0
		public Boolean isEstimate;
	}
	public class useOfProceeds {
		public grossProceedsUsed grossProceedsUsed;
		public String clarificationOfResponse;
	}
	public class grossProceedsUsed {
		public Long dollarAmount;	//0	
		public Boolean isEstimate;
	}
	public class signatureBlock {
		public boolean authorizedRepresentative;
		public signature[] signature;
	}
	public class signature {
		public String issuerName;	//O2 SIB Co-Investors, LLC
		public String signatureName;	///s/ Patrick R. Corden
		public String nameOfSigner;	//Patrick R. Corden
		public String signatureTitle;	//Chairman and President
		public String signatureDate;	//2022-10-12
	}
	public static FormDWarapper parse(String json){
		return (FormDWarapper) System.JSON.deserialize(json, FormDWarapper.class);
	}
}