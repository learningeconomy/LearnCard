/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Connectnewcaption3Inputs */

const en_dashboard_quickactions_connectnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add your first credential`)
};

const es_dashboard_quickactions_connectnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega tu primera credencial`)
};

const fr_dashboard_quickactions_connectnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez votre première certification`)
};

const ar_dashboard_quickactions_connectnewcaption3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف شهادتك الأولى`)
};

/**
* | output |
* | --- |
* | "Add your first credential" |
*
* @param {Dashboard_Quickactions_Connectnewcaption3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_connectnewcaption3 = /** @type {((inputs?: Dashboard_Quickactions_Connectnewcaption3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Connectnewcaption3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_connectnewcaption3(inputs)
	if (locale === "es") return es_dashboard_quickactions_connectnewcaption3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_connectnewcaption3(inputs)
	return ar_dashboard_quickactions_connectnewcaption3(inputs)
});
export { dashboard_quickactions_connectnewcaption3 as "dashboard.quickActions.connectNewCaption" }