sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, UIComponent, mobileLibrary, History, Filter, FilterOperator) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("bpmaint00.bpmaint00.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter : function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel : function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress : function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },

        getText: function (sTextId, aArgs) { 
            var oView = this.getView(); 
            var oModel = oView.getModel("i18n");

            if (!oModel) { 
                oModel = sap.ui.model.resource.ResourceModel({ bundleName: "bpmaint00.bpmaint00.i18n.i18n" }); 
                oView.setModel(oModel, "i18n"); 
            }
            return oModel.getResourceBundle().getText(sTextId, aArgs); 
        },

        _onNavBack: function (sPath) {
            var sPreviousHash = History.getInstance().getPreviousHash(),
                sHistory = sPath;
            // sHistory = Utils.returnNow(sPath);
            if (sPreviousHash === sHistory) {
                window.history.go(-1);
            } else {
                if (!sHistory) {
                    sap.ui.core.UIComponent.getRouterFor(this).navTo("worklist", true);
                } else {
                    sap.ui.core.UIComponent.getRouterFor(this).navTo(sHistory, true);
                }
                
            }
        },

        openCountryDialog: function (oEvent) {
            if (!this._oCountryDialog) { 
                this._oCountryDialog = sap.ui.xmlfragment("bpmaint00.bpmaint00.view.fragment.CountryDialog", this); 
                this.getView().addDependent(this._oCountryDialog); 
            }

            this._oCountryDialog.open();
        },

        onSearchCountryDialog: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("LandName", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        }

    });

});