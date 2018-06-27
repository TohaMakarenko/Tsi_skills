loadDuplicates: function () {
    var esq = this.Ext.create(Terrasoft.EntitySchemaQuery,
        {
            rootSchemaName: "Account"
        });
    esq.addColumn("AlternativeName");
    esq.addColumn("INN");
    esq.addColumn("CreatedOn");
    esq.addColumn("CreatedBy");
    esq.filters.addItem(this.Terrasoft.createColumnFilterWithParameter(
        this.Terrasoft.ComparisonType.NOT_EQUAL,
        "Id",
        this.get("AccountIdId")));
    esq.filters.addItem(this.Terrasoft.createColumnFilterWithParameter(
        this.Terrasoft.ComparisonType.EQUAL,
        "AlternativeName",
        this.get("AlternativeName")));

    esq.getEntityCollection(function (response) {
        if (response.success && response.collection && !response.collection.isEmpty()) {
            this.fillGridData(response.collection);
        }
    }, this);
}