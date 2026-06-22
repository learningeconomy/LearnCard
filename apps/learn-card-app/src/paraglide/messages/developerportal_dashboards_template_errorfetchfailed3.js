/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Template_Errorfetchfailed3Inputs */

const en_developerportal_dashboards_template_errorfetchfailed3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorfetchfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to fetch templates`)
};

const es_developerportal_dashboards_template_errorfetchfailed3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorfetchfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al obtener plantillas`)
};

const fr_developerportal_dashboards_template_errorfetchfailed3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorfetchfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la récupération des modèles`)
};

const ar_developerportal_dashboards_template_errorfetchfailed3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorfetchfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل جلب القوالب`)
};

/**
* | output |
* | --- |
* | "Failed to fetch templates" |
*
* @param {Developerportal_Dashboards_Template_Errorfetchfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_template_errorfetchfailed3 = /** @type {((inputs?: Developerportal_Dashboards_Template_Errorfetchfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Template_Errorfetchfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_template_errorfetchfailed3(inputs)
	if (locale === "es") return es_developerportal_dashboards_template_errorfetchfailed3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_template_errorfetchfailed3(inputs)
	return ar_developerportal_dashboards_template_errorfetchfailed3(inputs)
});
export { developerportal_dashboards_template_errorfetchfailed3 as "developerPortal.dashboards.template.errorFetchFailed" }