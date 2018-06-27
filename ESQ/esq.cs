public static void ESQtest(UserConnection userConnection)
{
    var esq = new EntitySchemaQuery(userConnection.EntitySchemaManager, "TSApplication");
    esq.JoinRightState = QueryJoinRightLevel.Disabled;
    esq.AddColumn("TSNumber");
    var ownerNameColumn = esq.AddColumn("=TSOwner.Name");
    esq.Filters.Add(esq.CreateExistsFilter("[Activity:TSApplication:Id].Id"));
    esq.Filters.Add(esq.CreateIsNotNullFilter("TSAccount"));
    esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.GreaterOrEqual, "CreatedOn",
        DateTime.Today));
    var result = esq.GetEntityCollection(userConnection);
    var sqlQuery = esq.GetSelectQuery(userConnection);
    sqlQuery.BuildParametersAsValue = true;
    Console.WriteLine(sqlQuery.GetSqlText());

    foreach (var i in result) {
        Console.WriteLine(
            $"{i.GetTypedColumnValue<string>("TSNumber")} {i.GetTypedColumnValue<string>(ownerNameColumn.Name)}");
    }

    Console.ReadKey();
}