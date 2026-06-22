/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ value: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs */

const en_developerportal_dashboards_tabs_csvupload_errornotemplatefound5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No template found for "${i?.value}"`)
};

const es_developerportal_dashboards_tabs_csvupload_errornotemplatefound5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No se encontró plantilla para "${i?.value}"`)
};

const fr_developerportal_dashboards_tabs_csvupload_errornotemplatefound5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aucun modèle trouvé pour "${i?.value}"`)
};

const ar_developerportal_dashboards_tabs_csvupload_errornotemplatefound5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على قالب لـ "${i?.value}"`)
};

/**
* | output |
* | --- |
* | "No template found for \"{value}\"" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_errornotemplatefound5 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Errornotemplatefound5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_errornotemplatefound5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_errornotemplatefound5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_errornotemplatefound5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_errornotemplatefound5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_errornotemplatefound5 as "developerPortal.dashboards.tabs.csvUpload.errorNoTemplateFound" }