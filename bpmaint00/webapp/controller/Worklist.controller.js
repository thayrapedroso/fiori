sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("bpmaint00.bpmaint00.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                New: {
                    PartnerType: '',
                    PartnerName1: '',
                    PartnerName2: '',
                    SearchTerm1: '',
                    SearchTerm2: '',
                    Street: '',
                    HouseNumber: '',
                    District: '',
                    City: '',
                    Region: '',
                    ZipCode: '',
                    Country: ''
                },
                controls: {
                    buttonMessagesText: "",
                    buttonMessagesType: ""
                },
                messages: {
                    messageSet: []
                },
                busy: false
            });
            this.setModel(oViewModel, "worklistView");
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },


        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("PartnerId", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        onCreatePress: function () {
            this._getDialog().open();
        },

        onClose: function () {
            let cbTipo = this._oDialog.getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[0];

            // Carrega valor padrão
            cbTipo.setSelectedKey(1);
            this._getDialog().close();
        },

        onSavePress: function () {
            var that = this;
            let oViewModel = this.getModel("worklistView");
            let oJson = oViewModel.getProperty("/New");
            let oModelControls = oViewModel.getProperty("/controls");
            let oModelMessages = oViewModel.getProperty("/messages");
            let oModel = this.getOwnerComponent().getModel();

            if (oJson.PartnerType == '') { // if (!oJson.PartnerType) {
                MessageToast.show("Preencher o tipo de parceiro.");
            } else {
                oViewModel.setProperty("/busy", true);
                oModel.create("/BusinessPartnerSet", oJson, {
                    success: (oData) => {
                        MessageBox.success(that.getText("msgBPCreated", [oData.PartnerId]), {
                            title: that.getText("txtBPUpdated"),
                            onClose: function () {
                                that._getDialog().close();
                                oViewModel.setProperty("/busy", false);
                            }
                        });
                    },
                    error: (oError) => {
                        /*MessageBox.error(that.getText("msgBPCrtError"), {
                            title: that.getText("txtBPCrtError")
                        });*/

                        if (oError.responseText) {

                            let oBody = JSON.parse(oError.responseText);
                            let errorDetails = oBody.error.innererror.errordetails;
                            let aErrorDetails = [];
                            let sMessage = "";

                            if (errorDetails) {
                                aErrorDetails = errorDetails.reduce(function (a, b) {
                                    function indexOfProperty(a, b) {
                                        for (var i = 0; i < a.length; i++) {
                                            if (a[i].message == b.message) {
                                                return i;
                                            }
                                        }
                                        return -1;
                                    }
                                    if (indexOfProperty(a, b) < 0) a.push(b);
                                    return a;
                                }, []);
                                for (let i = 0, len = aErrorDetails.length; i < len; i++) {
                                    var message = aErrorDetails[i].message + "\n\n";
                                    sMessage += message;
                                }

                                jQuery.sap.require("sap.m.MessageBox");
                                MessageBox.show(sMessage, sap.m.MessageBox.Icon.NONE, "Update Messages");

                                oModelControls.buttonMessagesText = aErrorDetails.length;
                                oModelControls.buttonMessagesType = "Emphasized";
                                oViewModel.setProperty("/controls", oModelControls);

                                oModelMessages.messageSet = aErrorDetails;
                                oViewModel.setProperty("/messages", oModelMessages);
                            }
                        } else {
                            MessageBox.error(that.getText("msgBPCrtError"), {
                                title: that.getText("txtBPCrtError")
                            });
                        }

                    }
                });
            }
        },

        messagePopoverOpen: function(){
            this._getDialogPopover().open();
        },

        onCloseCountryDialog: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            let oViewModel = this.getModel("worklistView");
            let oNew = oViewModel.getProperty("/New");

            if (oSelectedItem) {
                oNew.Country = oSelectedItem.getTitle();
                oViewModel.setProperty("/New", oNew);
            } else {
                oInput.resetProperty("value"); oInput.resetProperty("description");
            }

            // Limpa o filtro
            this._oCountryDialog.getBinding("items").filter("");
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/BusinessPartnerSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },

        _getDialog: function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("bpmaint00.bpmaint00.view.fragment.New", this);
                this.getView().addDependent(this._oDialog);

                this.carregaTipo();
            }

            return this._oDialog;
        },

        _getDialogPopover: function () {
            if (!this._oDialogPopover) {
                this._oDialogPopover = sap.ui.xmlfragment("bpmaint00.bpmaint00.view.fragment.MessagePopover", this);
                this.getView().addDependent(this._oDialogPopover);
            }

            return this._oDialogPopover;
        },

        carregaTipo: function () {
            let cbTipo = this._oDialog.getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[0];

            cbTipo.addItem(new sap.ui.core.Item({
                key: 1,
                text: this.getResourceBundle().getText("txtOrganization")
            }));

            cbTipo.addItem(new sap.ui.core.Item({
                key: 2,
                text: this.getResourceBundle().getText("txtPerson")
            }));

            // Carrega valor padrão
            cbTipo.setSelectedKey(1);
        }

    });
});
