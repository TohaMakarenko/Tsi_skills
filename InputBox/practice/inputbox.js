printTpIuApplication: function () {
    var caption = this.get("Resources.Strings.PrintTpIuApplicationInputBoxCaption");
    var pfCaption = this.get("Resources.Strings.PrintTpIuApplicationButtonCaption");
    var applicationId = this.get("Id");
    var buttons = Terrasoft.MessageBoxButtons;
    Terrasoft.utils.inputBox(
        caption,
        function (result, arg) {
            if (result === buttons.OK.returnCode && arg.AccountSigner) {
                ServiceHelper.callService("TSIndividualConditionReportService",
                    "CreateTpIuApplicationReport", function (response) {
                        if (response) {
                            var caption = pfCaption;
                            var key = response.CreateTpIuApplicationReportResult;
                            this.downloadReport(caption, key);
                        }
                    }, {
                        recordId: applicationId,
                        signerId: arg.AccountSigner.value.value
                    }, this)

            }
        }, [
            buttons.OK.returnCode,
            buttons.CLOSE.returnCode],
        this, {
            AccountSigner: {
                dataValueType: Terrasoft.DataValueType.ENUM,
                customConfig: {
                    list: { bindTo: "AccountSigners" },
                    prepareList: { bindTo: "loadAccountSigners" }
                },
                caption: caption,
                value: null,
                isRequired: true
            }
        }, {
            defaultButton: 0
        }
    );

    Terrasoft.MessageBox.controlArray.forEach(function (item) {
        item.control.bind(this);
    }.bind(this));
},
loadAccountSigners: function(filterParameter, list) {
    if (Terrasoft.isEmptyObject(list)) {
        return;
    }
    list.clear();
    var accountId = this.get("TSAccount");
    accountId = accountId && accountId.value;

    var esq = Ext.create("Terrasoft.EntitySchemaQuery", {
        rootSchemaName: "TSAccountSigner"
    });

    esq.addColumn("TSFullName");
    esq.filters.addItem(this.Terrasoft.createColumnFilterWithParameter(
        this.Terrasoft.ComparisonType.EQUAL,
        "TSAccount", accountId));

    esq.getEntityCollection(function (responce) {
        if (responce && responce.success) {
            var result = {};
            var i = 0;
            responce.collection.each(function (item) {
                result[i++] = {
                    value: item.get("Id"),
                    displayValue: item.get("TSFullName")
                };
            });
            list.loadAll(result);
        }
    }, this);
},