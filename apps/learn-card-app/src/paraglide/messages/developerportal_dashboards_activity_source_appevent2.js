/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Source_Appevent2Inputs */

const en_developerportal_dashboards_activity_source_appevent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Appevent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Event`)
};

const es_developerportal_dashboards_activity_source_appevent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Appevent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evento de App`)
};

const fr_developerportal_dashboards_activity_source_appevent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Appevent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Événement App`)
};

const ar_developerportal_dashboards_activity_source_appevent2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Source_Appevent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث التطبيق`)
};

/**
* | output |
* | --- |
* | "App Event" |
*
* @param {Developerportal_Dashboards_Activity_Source_Appevent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_source_appevent2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Source_Appevent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Source_Appevent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_source_appevent2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_source_appevent2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_source_appevent2(inputs)
	return ar_developerportal_dashboards_activity_source_appevent2(inputs)
});
export { developerportal_dashboards_activity_source_appevent2 as "developerPortal.dashboards.activity.source.appEvent" }