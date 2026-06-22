/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Source_Claimlink2Inputs */

const en_developerportal_dashboards_activity_source_claimlink2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim Link`)
};

const es_developerportal_dashboards_activity_source_claimlink2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de Reclamo`)
};

const fr_developerportal_dashboards_activity_source_claimlink2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de Réclamation`)
};

const ar_developerportal_dashboards_activity_source_claimlink2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط المطالبة`)
};

/**
* | output |
* | --- |
* | "Claim Link" |
*
* @param {Developerportal_Dashboards_Activity_Source_Claimlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_source_claimlink2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Source_Claimlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Source_Claimlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_source_claimlink2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_source_claimlink2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_source_claimlink2(inputs)
	return ar_developerportal_dashboards_activity_source_claimlink2(inputs)
});
export { developerportal_dashboards_activity_source_claimlink2 as "developerPortal.dashboards.activity.source.claimLink" }