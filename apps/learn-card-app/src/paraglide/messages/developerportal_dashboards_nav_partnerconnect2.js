/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Partnerconnect2Inputs */

const en_developerportal_dashboards_nav_partnerconnect2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Partnerconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Connect`)
};

const es_developerportal_dashboards_nav_partnerconnect2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Partnerconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Connect`)
};

const fr_developerportal_dashboards_nav_partnerconnect2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Partnerconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Connect`)
};

const ar_developerportal_dashboards_nav_partnerconnect2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Partnerconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Connect`)
};

/**
* | output |
* | --- |
* | "Partner Connect" |
*
* @param {Developerportal_Dashboards_Nav_Partnerconnect2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_partnerconnect2 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Partnerconnect2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Partnerconnect2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_partnerconnect2(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_partnerconnect2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_partnerconnect2(inputs)
	return ar_developerportal_dashboards_nav_partnerconnect2(inputs)
});
export { developerportal_dashboards_nav_partnerconnect2 as "developerPortal.dashboards.nav.partnerConnect" }