/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Source_Unknown1Inputs */

const en_developerportal_dashboards_activity_source_unknown1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown`)
};

const es_developerportal_dashboards_activity_source_unknown1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconocido`)
};

const fr_developerportal_dashboards_activity_source_unknown1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inconnu`)
};

const ar_developerportal_dashboards_activity_source_unknown1 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Unknown1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {Developerportal_Dashboards_Activity_Source_Unknown1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_source_unknown1 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Source_Unknown1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Source_Unknown1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_source_unknown1(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_source_unknown1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_source_unknown1(inputs)
	return ar_developerportal_dashboards_activity_source_unknown1(inputs)
});
export { developerportal_dashboards_activity_source_unknown1 as "developerPortal.dashboards.activity.source.unknown" }