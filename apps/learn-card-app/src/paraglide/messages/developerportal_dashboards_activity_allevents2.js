/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Allevents2Inputs */

const en_developerportal_dashboards_activity_allevents2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Allevents2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Events`)
};

const es_developerportal_dashboards_activity_allevents2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Allevents2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los Eventos`)
};

const fr_developerportal_dashboards_activity_allevents2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Allevents2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les Événements`)
};

const ar_developerportal_dashboards_activity_allevents2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Allevents2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كل الأحداث`)
};

/**
* | output |
* | --- |
* | "All Events" |
*
* @param {Developerportal_Dashboards_Activity_Allevents2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_allevents2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Allevents2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Allevents2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_allevents2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_allevents2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_allevents2(inputs)
	return ar_developerportal_dashboards_activity_allevents2(inputs)
});
export { developerportal_dashboards_activity_allevents2 as "developerPortal.dashboards.activity.allEvents" }