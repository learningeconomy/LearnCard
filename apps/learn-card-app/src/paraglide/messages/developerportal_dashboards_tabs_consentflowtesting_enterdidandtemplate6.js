/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a DID and select a template`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa un DID y selecciona una plantilla`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer un DID et sélectionner un modèle`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال DID واختيار قالب`)
};

/**
* | output |
* | --- |
* | "Please enter a DID and select a template" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Enterdidandtemplate6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_enterdidandtemplate6 as "developerPortal.dashboards.tabs.consentFlowTesting.enterDidAndTemplate" }