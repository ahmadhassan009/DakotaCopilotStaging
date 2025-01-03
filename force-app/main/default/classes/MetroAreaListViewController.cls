public class MetroAreaListViewController {

    public class MetroAreaData
    {
        @AuraEnabled public String MetroAreaId { get; set; }
        @AuraEnabled public String MetroAreaName { get; set; }
        @AuraEnabled public String Country { get; set; }
        @AuraEnabled public Decimal NumOfAccounts { get; set; }
        @AuraEnabled public Decimal NumOfContacts { get; set; }
        @AuraEnabled public String favoriteIcon { get; set; }
        @AuraEnabled public Boolean isFavorite { get; set; }
        @AuraEnabled public String favId { get; set; }
        @AuraEnabled public String favIconColor { get; set; }
        @AuraEnabled public String iconStatus { get; set; }
    }

    public class StateData
    {
        @AuraEnabled public String StateName { get; set; }
        @AuraEnabled public Integer CountofMA { get; set; }
        @AuraEnabled public String MetroAreaId { get; set; }
        @AuraEnabled public Decimal numOfAccount { get; set; }
    }

    public class MetroAreaCountriesList
    {
        @AuraEnabled public String countryName { get; set; }
        @AuraEnabled public Decimal NumOfAccounts { get; set; }
    }

    /**
     * Wrapper class for Metro Area Custom Subpanels
     */
    public class MetroAreaCustomSubPanelData implements Comparable
    {
        @AuraEnabled public String MasterLabel { get; set; }
        @AuraEnabled public String AccountTypeValues { get; set; }
        @AuraEnabled public String PanelIconInitial { get; set; }
        @AuraEnabled public String PanelIconColor { get; set; }
        @AuraEnabled public Decimal SubPanelSortOrder { get; set; }
        @AuraEnabled public String SubPanelColumns { get; set; }
        @AuraEnabled public String SubAccountTypeValues { get; set; }
        
        public Integer compareTo(Object compareTo) {
            MetroAreaCustomSubPanelData compareToRecords = (MetroAreaCustomSubPanelData)compareTo;
            // The return value of 0 indicates that both elements are equal.
            Integer returnValue = 0;
            if (SubPanelSortOrder > compareToRecords.SubPanelSortOrder) {
                // Set return value to a positive value.
                returnValue = -1;
            } else if (SubPanelSortOrder < compareToRecords.SubPanelSortOrder) {
                // Set return value to a negative value.
                returnValue = 1;
            }
            return returnValue; 
        }
    }

    @AuraEnabled
    public static void upsertListView(String listViewId, String moduleName, String listViewName, String filterFieldName, String operator, String filterValue) {
        if(listViewId=='')
        {
            List_view_Preference__c listViewPrefrence = new List_view_Preference__c();
            listViewPrefrence.Name = listViewName;
            listViewPrefrence.Module_Name__c = moduleName;
            listViewPrefrence.Field_Name__c = filterFieldName;
            listViewPrefrence.Operator__c = operator;
            listViewPrefrence.Filter__c = filterValue;
            insert listViewPrefrence;
        }
        else {
            List_view_Preference__c listViewPrefrence = [SELECT Id, Name, Module_Name__c, Field_Name__c, Operator__c,Filter__c FROM List_view_Preference__c WHERE Id =:listViewId Limit 1];
            listViewPrefrence.Name = listViewName;
            listViewPrefrence.Module_Name__c = moduleName;
            listViewPrefrence.Field_Name__c = filterFieldName;
            listViewPrefrence.Operator__c = operator;
            listViewPrefrence.Filter__c = filterValue;
            update listViewPrefrence;
        }
    }

    /**
     * @description Delete a list view
     * @param String listViewId: id of the list view to be deleted 
     * @return Boolean
     */
    @AuraEnabled
    public static Boolean deleteListView(String listViewName) {
        List<List_view_Preference__c> listViewPreferences = [SELECT Id,Name FROM List_view_Preference__c WHERE Name =:listViewName];
        try {
            if(listViewPreferences.size()>0)
            {
                delete listViewPreferences;
                return true;
            }
            else {
                return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * @description Get a List of all the List view preferences records
     * 
     * @return List<List_view_Preference__c> 
     */
    @AuraEnabled
    public static List<List_view_Preference__c> getAllListViewNames()
    {
        List<String> listViews = new List<String>();
        List<List_view_Preference__c> listViewPreferences = [SELECT Id, Name,filter__c FROM List_view_Preference__c order by createdDate desc];
        List<MetroAreaCountriesList> listToReturn = new List<MetroAreaCountriesList>();
        MetroAreaCountriesList maObj1 = new MetroAreaCountriesList();
        return listViewPreferences;
    }

    /**
     * @description Check if there is already a list view with the same name
     * @param String listViewName: Name of the newly created or edited list view 
     * @param String listViewId: Id of the newly created or edited list view 
     * @return Boolean
     */
    @AuraEnabled
    public static Boolean isDuplicateListViewName(String listViewName, String listViewId) {
        List<List_view_Preference__c> listViewPreferences = [SELECT Id,Name FROM List_view_Preference__c WHERE Name =:listViewName AND Id != :listViewId];
        if(listViewPreferences.size()>0)
        {
            return true;
        }
        return false;
    }

    /**
     * @description Get a list view preference record
     * @param String listViewName: Name of the list view
     * @return Boolean
     */
    @AuraEnabled
    public static List_view_Preference__c getListViewDetails (String listViewName) {
        List_view_Preference__c listViewPreference = [SELECT Id, Name, Field_Name__c, Operator__c, Filter__c FROM List_view_Preference__c WHERE Name =:listViewName LIMIT 1];
        return listViewPreference;
    }

    /**
     * @description Get map of the total no of Accounts for each Country
     * 
     * @return Map<String, Decimal>
     */
    @AuraEnabled
    public static Map<String, Decimal> getAllCountriesCountList() {
        Map<String, Decimal> countriesAccountCountMap = new Map<String, Decimal>();
        Decimal allCountriesAccountsCount = 0;

        AggregateResult[] countriesAccountCountResults = [SELECT SUM(Sort_Order__c) accCount, Country__c FROM Metro_Area__c GROUP BY Country__c];   
        for(AggregateResult ar:countriesAccountCountResults) {
            countriesAccountCountMap.put((String)ar.get('Country__c'), (Decimal)ar.get('accCount'));
            allCountriesAccountsCount = allCountriesAccountsCount + (Decimal)ar.get('accCount');
        }
        countriesAccountCountMap.put('All',allCountriesAccountsCount);
        return countriesAccountCountMap;
    }
    
    @AuraEnabled
    public static Map<String, Decimal> getAllCountriesCountListForState() {
        Map<String, Decimal> countriesAccountCountMap = new Map<String, Decimal>();
        Decimal allCountriesAccountsCount = 0;
        Integer notSortorder = 0;
        String empty = '';
        AggregateResult[] countriesAccountCountResults = [SELECT count(id) accCount,Country__c FROM Metro_Area__c WHERE sort_order__c != :notSortorder AND State__c !=:empty Group by Country__c];   
        for(AggregateResult ar:countriesAccountCountResults) {
            countriesAccountCountMap.put((String)ar.get('Country__c'), (Decimal)ar.get('accCount'));
            allCountriesAccountsCount = allCountriesAccountsCount + (Decimal)ar.get('accCount');
        }
        countriesAccountCountMap.put('All',allCountriesAccountsCount);
        return countriesAccountCountMap;
    }

    /**
     * @description Get list of all countries and their sort order from custom metadata to show on List View
     * 
     * @return List<String>
     */
    @AuraEnabled
    public static List<MetroAreaCountriesList> getAllCountriesList() {
        List<MetroAreaCountriesList> listToReturn = new List<MetroAreaCountriesList>();
        Set<String> picklistCountries = new Set<String>();
        Set<String> countriesSet = new Set<String>();
        //Get only those countries that have Marketplace verified accounts > 0 i-e Sort_Order__c > 0 AND Country is not null.
        Map<Id,Metro_Area__c> maListMap = new Map<Id,Metro_Area__c>([SELECT Id, Name, Country__c, Sort_Order__c FROM Metro_Area__c]);
        for(Metro_Area__c ma: maListMap.values()) {
            if(ma.Country__c!=null)
            {
                countriesSet.add(ma.Country__c);
            }
        }

        // Get country name and sort order form custom metadata
        List<Metro_Area_Country_Sort_Order__mdt> contList = [SELECT MasterLabel, Sort_Order__c FROM Metro_Area_Country_Sort_Order__mdt
                                                            ORDER BY Sort_Order__c ASC NULLS LAST];

        Map<String, Decimal> countriesCountList = getAllCountriesCountList();
        List<Follow__c> allFavRecords = RecordsFavoriteController.getAllFavoriteRecords();
        Integer count = 0;
        for(Follow__c fav :allFavRecords)
        {
            if(fav.Object_Name__c =='Metro_Area__c')
            {               
                if(maListMap.containsKey(fav.Target_Id__c) && maListMap.get(fav.Target_Id__c).Sort_Order__c > 0)
                {
                    count++;
                }
            }
        }
        MetroAreaCountriesList favoriteObj = new MetroAreaCountriesList();
        favoriteObj.countryName = 'My Followed Items';
        favoriteObj.NumOfAccounts = count;
        listToReturn.add(favoriteObj);

        MetroAreaCountriesList territoriesObj = new MetroAreaCountriesList();
        territoriesObj.countryName = 'My Territories';
        territoriesObj.NumOfAccounts = 0;
        listToReturn.add(territoriesObj);

        MetroAreaCountriesList allObj = new MetroAreaCountriesList();
        allObj.countryName = 'All';
        allObj.NumOfAccounts = countriesCountList.get('All');
        listToReturn.add(allObj);

        for(Metro_Area_Country_Sort_Order__mdt cont: contList) {
            if(countriesSet.contains(cont.MasterLabel)) {
                MetroAreaCountriesList maObj = new MetroAreaCountriesList();
                maObj.countryName = cont.MasterLabel;
                if(countriesCountList.containsKey(cont.MasterLabel))
                {
                    maObj.NumOfAccounts = countriesCountList.get(cont.MasterLabel);
                }
                listToReturn.add(maObj);
            }
        }
        return listToReturn;
    }

    @AuraEnabled
    public static List<MetroAreaCountriesList> getAllCountriesListForState() {
        List<MetroAreaCountriesList> listToReturn = new List<MetroAreaCountriesList>();
        Set<String> picklistCountries = new Set<String>();
        Set<String> countriesSet = new Set<String>();
        //Get only those countries that have Marketplace verified accounts > 0 i-e Sort_Order__c > 0 AND Country is not null.
        List<Metro_Area__c> maList = [SELECT Id, Name, Country__c FROM Metro_Area__c WHERE Country__c != null];
        for(Metro_Area__c ma: maList) {
            countriesSet.add(ma.Country__c);
        }

        // Get country name and sort order form custom metadata
        List<Metro_Area_Country_Sort_Order__mdt> contList = [SELECT MasterLabel, Sort_Order__c FROM Metro_Area_Country_Sort_Order__mdt
                                                            ORDER BY Sort_Order__c ASC NULLS LAST];

        Map<String, Decimal> countriesCountList = getAllCountriesCountListForState();
        List<Follow__c> allFavRecords = RecordsFavoriteController.getAllFavoriteRecords();
        Integer count = 0;
        for(Follow__c fav :allFavRecords)
        {
            if(fav.Object_Name__c =='Metro_Area__c')
            {                count++;
            }
        }
        MetroAreaCountriesList favoriteObj = new MetroAreaCountriesList();
        favoriteObj.countryName = 'My Followed Items';
        favoriteObj.NumOfAccounts = count;
        listToReturn.add(favoriteObj);

        MetroAreaCountriesList territoriesObj = new MetroAreaCountriesList();
        territoriesObj.countryName = 'My Territories';
        territoriesObj.NumOfAccounts = 0;
        listToReturn.add(territoriesObj);

        MetroAreaCountriesList allObj = new MetroAreaCountriesList();
        allObj.countryName = 'All';
        allObj.NumOfAccounts = countriesCountList.get('All');
        listToReturn.add(allObj);

        for(Metro_Area_Country_Sort_Order__mdt cont: contList) {
            if(countriesSet.contains(cont.MasterLabel)) {
                MetroAreaCountriesList maObj = new MetroAreaCountriesList();
                maObj.countryName = cont.MasterLabel;
                if(countriesCountList.containsKey(cont.MasterLabel))
                {
                    maObj.NumOfAccounts = countriesCountList.get(cont.MasterLabel);
                }
                listToReturn.add(maObj);
            }
        }
        return listToReturn;
    }

    /**
     * @description Get Metro Area records count based on the search string or active country passed
     * @param List<String> searchList: List of search string 
     * @param Boolean isListView: To identify if active Country is a list view name
     * @param String activeCountry: Country clicked on the view
     * 
     * @return Integer
     */
    @AuraEnabled
    public static Integer getMetroAreaRecordsCount(List<String> searchList, Boolean isListView, String activeCountry) {
        String query;
        String whereClause;
        String regex = '\\s*,\\s*(?=(?:[^\\"]*\\"[^\\"]*\\")*[^\\"]*$)';
        if(activeCountry != '') {
            if (isListView) {
                List<String> metroAreaNamesList2 = new List<String>{};
                List_view_Preference__c listViewPreference = [SELECT Id, Name, Field_Name__c, operator__c, filter__c FROM List_view_Preference__c where Name =:activeCountry Limit 1 ];
                String filterField = listViewPreference.Field_Name__c;
                String metroAreaNames = listViewPreference.filter__c;
                String escapsedMetroAreaNames = String.escapeSingleQuotes(listViewPreference.filter__c);
                Boolean multipleMetroAreaNames = listViewPreference.filter__c.contains(',');
                Pattern MaSeparationPattern = Pattern.compile(regex);
                String maNamesForWhereClause;
                if(listViewPreference.operator__c == 'Equals')
                {
                    maNamesForWhereClause = MaSeparationPattern.matcher(escapsedMetroAreaNames).replaceAll('\',\'');
                    maNamesForWhereClause = '\'' + maNamesForWhereClause + '\'';
                    maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                    whereClause = ' WHERE ' + filterField + ' IN ' + '( ' + maNamesForWhereClause + ' )';

                }
                else if(listViewPreference.operator__c == 'Not Equals') {
                    maNamesForWhereClause = MaSeparationPattern.matcher(escapsedMetroAreaNames).replaceAll('\',\'');
                    maNamesForWhereClause = '\'' + maNamesForWhereClause + '\'';
                    maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                    whereClause = ' WHERE ' + filterField + ' Not IN ' + '( '+ maNamesForWhereClause + ' )';
                }
                else if(listViewPreference.operator__c == 'Does Not Contain') 
                {
                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        metroAreaNamesList2 = new List<String>{};
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add('%'+metroArea+'%');
                        }
                        whereClause = ' Where (NOT (' + filterField + ' Like :metroAreaNamesList2))'; 
                    }
                    else
                    {
                        whereClause = ' WHERE (NOT(' + filterField + ' LIKE ' + '\'%'+ escapsedMetroAreaNames + '%\'))';
                    }
                }
                else if(listViewPreference.operator__c == 'Contains') 
                {
                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        metroAreaNamesList2 = new List<String>{};
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add('%'+metroArea+'%');
                        }
                        whereClause = ' Where ' + filterField + ' Like :metroAreaNamesList2';
                    }
                    else
                    {
                        whereClause = ' WHERE ' + filterField + ' Like ' + '\'%'+ escapsedMetroAreaNames +'%\'';
                    }
                }
                else if(listViewPreference.operator__c == 'Starts With') {

                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        metroAreaNamesList2 = new List<String>{};
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add(metroArea+'%');
                        }
                        whereClause = ' Where ' + filterField + ' Like :metroAreaNamesList2';
                    }
                    else
                    {
                        whereClause = ' WHERE ' + filterField + ' Like ' + '\''+ escapsedMetroAreaNames +'%\'';
                    }
                }
                query = 'SELECT COUNT(Id) Id FROM Metro_Area__c '+whereClause;
            }
            
            else {
                if(activeCountry == 'All') {
                    query = 'SELECT COUNT(Id) Id FROM Metro_Area__c';
                } else {
                    query = 'SELECT COUNT(Id) Id FROM Metro_Area__c WHERE Country__c =: activeCountry';
                }
            }
        }
        if(searchList != null && searchList.size() > 0) {
            if(searchList.size() == 1) {
                searchList[0] = String.escapeSingleQuotes(searchList[0]);
                whereClause = 'Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' + 
                            ' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '% \'';
            } else {
                //if search keyword is also a state code e.g MA
                for(Integer i = 0; i<searchList.size(); i++) {
                    searchList[i] = String.escapeSingleQuotes(searchList[i]);
                }
                whereClause = '(Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +
                            ' OR Name LIKE \'' + searchList[1] + '%\'' + ' OR Name LIKE \'% ' +  searchList[1] + '%\')' +
                            ' OR (State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '%\'' +
                            ' OR State__c LIKE \'' + searchList[1] + '%\'' + ' OR State__c LIKE \'% ' +  searchList[1] + '%\')';
            }
            query = 'SELECT COUNT(Id) Id FROM Metro_Area__c WHERE ' + whereClause;
        }
        List<AggregateResult> metroAreas = Database.query(query);
        return (Integer)metroAreas[0].get('Id');
    }

    /**
     * @description Get Metro Area records based on the search list or active country. The records are sorted and in chunks
     * @param List<String> searchList: list of search string
     * @param String activeCountry: Country clicked on the view
     * @param String isListView: To identify if active Country is a list view name
     * @param String sortBy: Field to be sorted on
     * @param String sortOrder: ASC or DSC
     * @param Integer offset: Offset for the chunk
     * @param Integer recLimit: Limit for the number of records to return
     * @param List<Id> favList: list containing IDs of all favorite records
     * 
     * @return List<MetroAreaData>
     */
    @AuraEnabled
    public static List<MetroAreaData> getMetroAreaRecords(List<String> searchList, String activeCountry, Boolean isListView, String sortBy, String sortOrder, Integer offset, Integer recLimit, List<Id> favList) {
        String query;
        String whereClause;
        String regex = '\\s*,\\s*(?=(?:[^\\"]*\\"[^\\"]*\\")*[^\\"]*$)';
        List<Metro_Area__c> metroAreas = new List<Metro_Area__c>();
        if(activeCountry != '') {

            if (isListView) {
                List<String> metroAreaNamesList2 = new List<String>{};
                List_view_Preference__c listViewPreference = [SELECT Id, Name, Field_Name__c, operator__c, filter__c FROM List_view_Preference__c where Name =:activeCountry Limit 1 ];
                String filterField = listViewPreference.Field_Name__c;
                String metroAreaNames = listViewPreference.filter__c;
                String escapsedMetroAreaNames = String.escapeSingleQuotes(listViewPreference.filter__c);
                Boolean multipleMetroAreaNames = listViewPreference.filter__c.contains(',');
                Pattern MaSeparationPattern = Pattern.compile(regex);
                String maNamesForWhereClause;
                if(listViewPreference.operator__c == 'Equals')
                {
                    maNamesForWhereClause = MaSeparationPattern.matcher(escapsedMetroAreaNames).replaceAll('\',\'');
                    maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                    whereClause = ' WHERE ' + filterField + ' IN' + '( \''+ maNamesForWhereClause +'\' )'
                                + ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                }
                else if(listViewPreference.operator__c == 'Not Equals') {
                    maNamesForWhereClause = MaSeparationPattern.matcher(escapsedMetroAreaNames).replaceAll('\',\'');
                    maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                    whereClause = ' WHERE ' + filterField + ' NOT IN' + '( \''+ maNamesForWhereClause +'\' )'
                                + ' ORDER BY '  + sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                }
                else if(listViewPreference.operator__c == 'Does Not Contain') 
                {
                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add('%'+metroArea+'%');
                        }
                        whereClause = ' Where NOT (' + filterField + ' Like :metroAreaNamesList2)'
                                    + 'ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                    else
                    {
                        whereClause = ' WHERE (NOT(' + filterField + ' LIKE ' + '\'%'+ escapsedMetroAreaNames + '%\'))'
                                    + ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                }
                else if(listViewPreference.operator__c == 'Contains') {
                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add('%'+metroArea+'%');
                        }
                        whereClause = ' Where ' + filterField + ' Like :metroAreaNamesList2'+
                                    ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                    else
                    {
                        whereClause = ' WHERE ' + filterField + ' Like ' + '\'%'+ escapsedMetroAreaNames +'%\''
                                    + ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                }
                else if(listViewPreference.operator__c == 'Starts With') {
                    if(multipleMetroAreaNames)
                    {
                        maNamesForWhereClause = MaSeparationPattern.matcher(metroAreaNames).replaceAll('\',\'');
                        maNamesForWhereClause = maNamesForWhereClause.replaceAll('"','');
                        List<String> metroAreaNamesList = maNamesForWhereClause.trim().split('\',\'');
                        for(String metroArea : metroAreaNamesList){
                            metroAreaNamesList2.add(metroArea+'%');
                        }
                        whereClause = ' Where ' + filterField + ' Like :metroAreaNamesList2 '
                                    + ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                    else
                    {
                        whereClause = ' WHERE ' + filterField + ' Like ' + '\''+ escapsedMetroAreaNames +'%\' '
                                    + ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                    }
                }
                query = 'SELECT Id, Name, Country__c, Sort_Order__c, Number_of_Contacts__c FROM Metro_Area__c ' + whereClause;
            }
            
            else {
                if(activeCountry == 'All') {
                    whereClause = ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                } else if (activeCountry == 'My Followed Items') {
                    String favStr = '\'' + string.join(favList,'\',\'') + '\'';
                    whereClause = ' WHERE Id IN (' + favStr + ') ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                } 
                else {
                    whereClause = ' WHERE Country__c =: activeCountry ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
                }
                query = 'SELECT Id, Name, Country__c, Sort_Order__c, Number_of_Contacts__c FROM Metro_Area__c ' + whereClause;
            }
        }

        if(searchList != null && searchList.size() > 0) {
            if(searchList.size() == 1) {
                searchList[0] = String.escapeSingleQuotes(searchList[0]);
                whereClause = 'Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' + 
                            ' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '% \'';
            } else {
                //if search keyword is also a state code
                for(Integer i = 0; i<searchList.size(); i++) {
                    searchList[i] = String.escapeSingleQuotes(searchList[i]);
                }
                whereClause = '(Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +
                            ' OR Name LIKE \'' + searchList[1] + '%\'' + ' OR Name LIKE \'% ' +  searchList[1] + '%\')' +
                            ' OR (State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '%\'' +
                            ' OR State__c LIKE \'' + searchList[1] + '%\'' + ' OR State__c LIKE \'% ' +  searchList[1] + '%\')';
            }

            query = 'SELECT Id, Name, State__c, Country__c, Sort_Order__c, Number_of_Contacts__c FROM Metro_Area__c WHERE ' + whereClause + 
                                ' ORDER BY '+ sortBy + ' ' + sortOrder +' LIMIT ' + recLimit + ' OFFSET ' + offset;
        }
        metroAreas = Database.query(query);
        List<MetroAreaData> listToReturn = new List<MetroAreaData>();
        for(Metro_Area__c ma: metroAreas) {
            MetroAreaData maObj = new MetroAreaData();
            maObj.MetroAreaId = (String) ma.Id;
            maObj.MetroAreaName = (String) ma.Name;
            maObj.NumOfAccounts = ma.Sort_Order__c;
            maObj.NumOfContacts = ma.Number_of_Contacts__c;
            maObj.Country = (String) ma.Country__c != null ? (String) ma.Country__c : 'All';
            maObj.favoriteIcon = 'utility:add';
            maObj.favIconColor = 'slds-icon-text-light addIconStyling';
            maObj.iconStatus = 'Click To Follow';
            listToReturn.add(maObj);
        }
        return listToReturn;
    }

    @AuraEnabled
    public static Integer getCountMetroAreasByState(List<String> searchList,String activeCountry) {
        String query;
        String whereClause='';
        if(searchList != null && searchList.size() > 0) {
            if(searchList.size() == 1) {
                searchList[0] = String.escapeSingleQuotes(searchList[0]);
                whereClause = 'AND (Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '% \')';
            } else {
                //if search keyword is also a state code
                for(Integer i = 0; i<searchList.size(); i++) {
                    searchList[i] = String.escapeSingleQuotes(searchList[i]);
                }
                whereClause = 'AND (Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '%\'' +
                ' OR State__c LIKE \'' + searchList[1] + '%\'' + ' OR State__c LIKE \'%' +  searchList[1] + '%\')';
            }
        } 

        if(activeCountry == 'All') {
            query = 'SELECT COUNT(Id) FROM Metro_Area__c WHERE State__c != null '+whereClause+' GROUP BY State__c';
        } else {
            query = 'SELECT COUNT(Id) FROM Metro_Area__c WHERE Country__c =:activeCountry AND State__c != null '+whereClause+' GROUP BY State__c';
        }
        List<AggregateResult> metroAreas = Database.query(query);
        return (Integer)metroAreas.size();
    }

    @AuraEnabled
    public static List<StateData> getAllMetroAreasByState(List<String> searchList,String activeCountry, String sortDirection, Integer offset, Integer recLimit , String sortedBy) {
        String query;
        String whereClause='';
        if(searchList != null && searchList.size() > 0) {
            if(searchList.size() == 1) {
                searchList[0] = String.escapeSingleQuotes(searchList[0]);
                whereClause = 'AND (Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '% \')';
            } else {
                //if search keyword is also a state code
                for(Integer i = 0; i<searchList.size(); i++) {
                    searchList[i] = String.escapeSingleQuotes(searchList[i]);
                }
                whereClause = 'AND (Name LIKE \'' + searchList[0] + '%\'' + ' OR Name LIKE \'% ' + searchList[0] + '%\'' +' OR State__c LIKE \'' + searchList[0] + '%\'' + ' OR State__c LIKE \'% ' + searchList[0] + '%\'' +
                ' OR State__c LIKE \'' + searchList[1] + '%\'' + ' OR State__c LIKE \'%' +  searchList[1] + '%\')';
            }
        } 
        if(activeCountry == 'All') {
            query = 'SELECT toLabel(State__c), COUNT(Id) numOfMetroAreas, SUM(Sort_order__c) numOfAccount FROM Metro_Area__c WHERE State__c != null '+whereClause+' GROUP BY State__c ORDER BY '+sortedBy+' ' 
                    + sortDirection + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        } else {
            query = 'SELECT toLabel(State__c), COUNT(Id) numOfMetroAreas, SUM(Sort_order__c) numOfAccount FROM Metro_Area__c WHERE Country__c =:activeCountry AND State__c != null '+whereClause+' GROUP BY State__c ORDER BY '+sortedBy+' ' 
                    + sortDirection + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        }

        List<AggregateResult> metroAreas = Database.query(query);

        List<StateData> listToReturn = new List<StateData>();
        for(AggregateResult ma: metroAreas) {
            StateData stObj = new StateData();
                stObj.StateName = (String) ma.get('State__c');
                stObj.CountofMA = (Integer) ma.get('numOfMetroAreas');
                stObj.numOfAccount = (Decimal) ma.get('numOfAccount');
                listToReturn.add(stObj);
        }

        return listToReturn;
    }


    @AuraEnabled
    public static List<Metro_Area__c> getMetroAreasForSingleState(String stateName) {
        //Add check that state should not be null
        return [ 
            SELECT Id, Name, Country__c, State__c, Sort_Order__c FROM Metro_Area__c WHERE State__c=:stateName 
        ];
    }

    public static Set<Id> getAccIDsRelatedToSubMetroAreas (List<Metro_Area__c> metroAreas)
    {
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        for(Sub_Metro_Area__c sub : [Select Id,Account__c from Sub_Metro_Area__c where Metro_Area__c In :metroAreas])
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        return accIDsRelatedToSubMetroAreas;
    }

    //For metroArea by State list view
   @AuraEnabled
   public static List<Account> getRelatedAccountRecords(String stateName, String sortedBy, String sortedDirection, Integer recordLimit, Integer offset) {
       List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
       Set<Id> accIDsRelatedToSubMetroAreas = getAccIDsRelatedToSubMetroAreas(metroAreasByStates);
       String query = 'SELECT Id, Name,MetroArea__c,MetroArea__r.Name, Type, AUM__c, Website, BillingCity, Description FROM Account WHERE MetroArea__c IN :metroAreasByStates  OR id IN :accIDsRelatedToSubMetroAreas' + 
       ' ORDER BY ' + sortedBy + ' ' + sortedDirection + ' NULLS LAST LIMIT ' + recordLimit + ' OFFSET ' + offset;
       return Database.query(query);
   }


//For metroArea by State list view
    @AuraEnabled
    public static Integer getRelatedAccountCount(String stateName) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        Set<Id> accIDsRelatedToSubMetroAreas = getAccIDsRelatedToSubMetroAreas(metroAreasByStates);
        return [
                SELECT COUNT() 
                FROM Account
                WHERE MetroArea__c IN :metroAreasByStates OR ID IN :accIDsRelatedToSubMetroAreas
        ];
    }

    @AuraEnabled
    public static List<Metro_Area__c> getRelatedContactRecords(String stateName,String sortedBy, String sortedDirection, Integer recordLimit, Integer offset,Boolean homeOffice) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        String query = 'SELECT Id, Name,Metro_Area__c,Metro_Area__r.Name, Email, Title, Contact_Type__c, AccountId, Account.Name, Account.Type, MailingState FROM Contact WHERE Metro_Area__c IN :metroAreasByStates AND Is_In_Home_Office__c = \''+homeOffice+'\' ORDER BY ' + sortedBy + ' ' + sortedDirection + ' NULLS LAST LIMIT ' + recordLimit + ' OFFSET ' + offset;
        return Database.query(query);
    }

    @AuraEnabled
    public static Integer getRelatedContactCount(String stateName,Boolean homeOffice) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        
        if(homeOffice) {
            return [
                SELECT COUNT() 
                FROM Contact
                WHERE Metro_Area__c IN :metroAreasByStates  AND Is_In_Home_Office__c = 'true'
                ];
        }
        else {
            return [
                SELECT COUNT() 
                FROM Contact
                WHERE Metro_Area__c IN :metroAreasByStates AND Is_In_Home_Office__c = 'false'
        ];
        }
    }
      
    @AuraEnabled
    public static Integer getAccountTypeCount(String stateName, String accountType,String subAccountType) { 
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        Set<Id> accIDsRelatedToSubMetroAreas = getAccIDsRelatedToSubMetroAreas(metroAreasByStates);
        String query ='';
        List<String> accountTypes = accountType.split(',');
        List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
        String primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
        query = 'SELECT COUNT() FROM Account WHERE (MetroArea__c IN :metroAreasByStates OR Id IN :accIDsRelatedToSubMetroAreas) AND ( '+primaryWhereCondition+' )' ; 
        return Database.countQuery(query);
    }

    @AuraEnabled
    public static List<Account> getRelatedAccounts(String stateName, String accountType, String sortedBy, String sortedDirection, Integer recordLimit, Integer offset, String subAccountType) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        Set<Id> accIDsRelatedToSubMetroAreas = getAccIDsRelatedToSubMetroAreas(metroAreasByStates);
        String investmentFocus;
        String query;
        List<String> accountTypes = accountType.split(',');
        List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
        String primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
        if(accountType == 'DC Plan' || accountType == 'Corporate Pension Plan' || accountType == 'Taft-Hartley Plan (ERISA)') {
            query = 'SELECT Id, Name, MetroArea__c,MetroArea__r.Name, AUM__c, BillingCity, Form_5500__c, (SELECT Plan_Administrator_Contact_Name__c, Spons_DFE_Phone_Num__c FROM Form_5500_Additional_Information__r LIMIT 1) FROM Account WHERE  (MetroArea__c IN :metroAreasByStates OR Id IN :accIDsRelatedToSubMetroAreas) AND ('+ primaryWhereCondition +') ORDER BY ' + sortedBy + ' ' + sortedDirection + ' NULLS LAST LIMIT ' + recordLimit + ' OFFSET ' + offset; 
        } else {
            query = 'SELECT Id, Name, MetroArea__c,MetroArea__r.Name, Investment_Focus_single__c, Parent.name, AUM__c, Website, BillingCity, Description, BillingLatitude, BillingLongitude, toLabel(Draft_Sales_Cycle__c) FROM Account WHERE  (MetroArea__c IN :metroAreasByStates OR Id IN :accIDsRelatedToSubMetroAreas) AND ('+primaryWhereCondition +') ORDER BY ' + sortedBy + ' ' + sortedDirection + ' NULLS LAST LIMIT ' + recordLimit + ' OFFSET ' + offset; 
        }
        
        return  Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<MetroAreaCustomSubPanelData> getRelatedAccountsMetadata(String stateName)  {
        List<MetroAreaCustomSubPanelData> metroAreaCustomSubPanelResult = new List<MetroAreaCustomSubPanelData>();
        metroAreaCustomSubPanelResult.addAll(getOrderedMetroAreaMetaData(stateName));
        return metroAreaCustomSubPanelResult;
    }

    /**
     * @description To get Metro areas subpanel metadata section wise (Section 1 & 2)
     * DSC-670 : Metro Area Subpanel Revamp
     * Section 1 shows the account type in metadata and sorted based on verified account record count
     * Section 2 shows account type in metadata sorted alphabetically
     * 
     * @param metroAreaId the current metro area record
     * 
     * @return list of custom object (MetroAreaCustomSubPanelData)
     */
    private static List<MetroAreaCustomSubPanelData> getOrderedMetroAreaMetaData(String stateName) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        Map<String, Integer> typeToVerifiedAccMap = new Map<String, Integer>();
        Map<String, Integer> SubtypeToVerifiedAccMap = new Map<String, Integer>();
        List<MetroAreaCustomSubPanelData> tempmetroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        List<MetroAreaCustomSubPanelData> metroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        Set<Id> accIDsRelatedToSubMetroAreas = getAccIDsRelatedToSubMetroAreas(metroAreasByStates);

        // to get verified account record count grouped on type
        for (AggregateResult aggRes : [SELECT Count(Id) numofInvestmentAccounts, Type FROM Account WHERE RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        AND X100_Marketplace__c = true AND (MetroArea__c IN :metroAreasByStates OR Id IN : accIDsRelatedToSubMetroAreas) GROUP BY Type ORDER BY Count(Id) DESC]) {
            typeToVerifiedAccMap.put((String)aggRes.get('Type'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }

        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, Sub_Type__c from Account where RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        and X100_Marketplace__c = true and (MetroArea__c IN :metroAreasByStates OR Id IN : accIDsRelatedToSubMetroAreas)  Group by Sub_Type__c ORDER BY Count(Id) DESC]) {
            SubtypeToVerifiedAccMap.put((String)aggRes.get('Sub_Type__c'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }
        Map<String, Integer> mainMap = new Map<String, Integer>();
        for(String key : SubtypeToVerifiedAccMap.keyset() ) {
            if(key != null && !typeToVerifiedAccMap.containsKey(key)) {
                mainMap.put(key,SubtypeToVerifiedAccMap.get(key));
            } else if (key != null){
                mainMap.put(key, typeToVerifiedAccMap.get(key) + SubtypeToVerifiedAccMap.get(key));
            }
        }
        for(String key : typeToVerifiedAccMap.keyset()){
            if (!mainMap.containsKey(key)) {
                mainMap.put(key,typeToVerifiedAccMap.get(key));
            }
        }
        typeToVerifiedAccMap = mainMap;


        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection1 = [SELECT MasterLabel, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c,Sub_Account_Type_Values__c
                                                                                FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                                WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '1'
                                                                                ORDER BY Sub_Panel_Sort_Order__c ASC];
       for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection1) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        metroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection1));

        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection2 = [SELECT MasterLabel, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                                                                            FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                            WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '2'
                                                                            ORDER BY MasterLabel ASC];
        for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection2) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        tempmetroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection2));
        tempmetroAreaSubPanelOrderedList.sort();
        metroAreaSubPanelOrderedList.addAll(tempmetroAreaSubPanelOrderedList);
        return metroAreaSubPanelOrderedList;
    }

    /**
     *  @description Set data in wrapper object
     * 
     *  @param subpanelMetadata list of metro area subpanel metadata
     * 
     * @return list of custom object (MetroAreaCustomSubPanelData)
     */
    private static List<MetroAreaCustomSubPanelData> setMetroAreaCustomSubPanelData (List<Metro_Area_Custom_Sub_Panel__mdt> subpanelMetadata) {
        List<MetroAreaCustomSubPanelData> metroAreaCustomSubPanelResult = new List<MetroAreaCustomSubPanelData>();
        for(Metro_Area_Custom_Sub_Panel__mdt md : subpanelMetadata) {
            MetroAreaCustomSubPanelData metroAreaPanel = new MetroAreaCustomSubPanelData();
            metroAreaPanel.MasterLabel = md.MasterLabel;
            metroAreaPanel.AccountTypeValues = md.Account_Type_Values__c;
            metroAreaPanel.PanelIconInitial = md.Panel_Icon_Initial__c;
            metroAreaPanel.PanelIconColor = md.Panel_Icon_Color__c;
            metroAreaPanel.SubPanelSortOrder = md.Sub_Panel_Sort_Order__c;
            metroAreaPanel.SubPanelColumns = md.Sub_Panel_Columns__c;
            metroAreaPanel.SubAccountTypeValues = md.Sub_Account_Type_Values__c;
            metroAreaCustomSubPanelResult.add(metroAreaPanel);
        }
        return metroAreaCustomSubPanelResult;
    }

    private static String createPrimaryWhereCondition(List<String> accountTypes, List<String> subAccountTypes) {
        String primaryWhereCondition = ' Type =: accountTypes ';
        if(subAccountTypes.size()>0 && accountTypes.size()>0) {
            primaryWhereCondition = ' Type =: accountTypes OR Sub_Type__c=:subAccountTypes ';
        }
        else if(subAccountTypes.size()>0 && accountTypes.size()==0) {
            primaryWhereCondition = ' Sub_Type__c=:subAccountTypes ';
        }
        else if(subAccountTypes.size()==0 && accountTypes.size()>0) {
            primaryWhereCondition = ' Type =: accountTypes ';
        }
        return primaryWhereCondition;
    }
}