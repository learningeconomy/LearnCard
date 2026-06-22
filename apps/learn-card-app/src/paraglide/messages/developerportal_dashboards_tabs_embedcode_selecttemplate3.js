/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs */

const en_developerportal_dashboards_tabs_embedcode_selecttemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Template`)
};

const es_developerportal_dashboards_tabs_embedcode_selecttemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Plantilla`)
};

const fr_developerportal_dashboards_tabs_embedcode_selecttemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le Modèle`)
};

const ar_developerportal_dashboards_tabs_embedcode_selecttemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار قالب`)
};

/**
* | output |
* | --- |
* | "Select Template" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_selecttemplate3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Selecttemplate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_selecttemplate3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_selecttemplate3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_selecttemplate3(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_selecttemplate3(inputs)
});
export { developerportal_dashboards_tabs_embedcode_selecttemplate3 as "developerPortal.dashboards.tabs.embedCode.selectTemplate" }