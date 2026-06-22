/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Embedcode2Inputs */

const en_developerportal_dashboards_nav_embedcode2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Embedcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed Code`)
};

const es_developerportal_dashboards_nav_embedcode2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Embedcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código Incrustado`)
};

const fr_developerportal_dashboards_nav_embedcode2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Embedcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code Intégré`)
};

const ar_developerportal_dashboards_nav_embedcode2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Embedcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكود المضمن`)
};

/**
* | output |
* | --- |
* | "Embed Code" |
*
* @param {Developerportal_Dashboards_Nav_Embedcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_embedcode2 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Embedcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Embedcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_embedcode2(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_embedcode2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_embedcode2(inputs)
	return ar_developerportal_dashboards_nav_embedcode2(inputs)
});
export { developerportal_dashboards_nav_embedcode2 as "developerPortal.dashboards.nav.embedCode" }