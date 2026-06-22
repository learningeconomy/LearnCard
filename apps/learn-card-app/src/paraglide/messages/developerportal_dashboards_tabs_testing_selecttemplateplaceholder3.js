/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs */

const en_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a template`)
};

const es_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona una plantilla`)
};

const fr_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un modèle`)
};

const ar_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالبًا`)
};

/**
* | output |
* | --- |
* | "Select a template" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Selecttemplateplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_testing_selecttemplateplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_testing_selecttemplateplaceholder3 as "developerPortal.dashboards.tabs.testing.selectTemplatePlaceholder" }