/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Browsepathwayslabel3Inputs */

const en_dashboard_quickactions_browsepathwayslabel3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Pathways`)
};

const es_dashboard_quickactions_browsepathwayslabel3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar rutas`)
};

const fr_dashboard_quickactions_browsepathwayslabel3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les itinéraires`)
};

const ar_dashboard_quickactions_browsepathwayslabel3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayslabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح المسارات`)
};

/**
* | output |
* | --- |
* | "Browse Pathways" |
*
* @param {Dashboard_Quickactions_Browsepathwayslabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_browsepathwayslabel3 = /** @type {((inputs?: Dashboard_Quickactions_Browsepathwayslabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Browsepathwayslabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_browsepathwayslabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_browsepathwayslabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_browsepathwayslabel3(inputs)
	return ar_dashboard_quickactions_browsepathwayslabel3(inputs)
});
export { dashboard_quickactions_browsepathwayslabel3 as "dashboard.quickActions.browsePathwaysLabel" }