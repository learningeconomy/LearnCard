/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Browsepathwayscaption3Inputs */

const en_dashboard_quickactions_browsepathwayscaption3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore available paths`)
};

const es_dashboard_quickactions_browsepathwayscaption3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descubre rutas disponibles`)
};

const fr_dashboard_quickactions_browsepathwayscaption3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Découvrez les itinéraires disponibles`)
};

const ar_dashboard_quickactions_browsepathwayscaption3 = /** @type {(inputs: Dashboard_Quickactions_Browsepathwayscaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتشف المسارات المتاحة`)
};

/**
* | output |
* | --- |
* | "Explore available paths" |
*
* @param {Dashboard_Quickactions_Browsepathwayscaption3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_browsepathwayscaption3 = /** @type {((inputs?: Dashboard_Quickactions_Browsepathwayscaption3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Browsepathwayscaption3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_browsepathwayscaption3(inputs)
	if (locale === "es") return es_dashboard_quickactions_browsepathwayscaption3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_browsepathwayscaption3(inputs)
	return ar_dashboard_quickactions_browsepathwayscaption3(inputs)
});
export { dashboard_quickactions_browsepathwayscaption3 as "dashboard.quickActions.browsePathwaysCaption" }