/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Quickactions_Connectnewlabel3Inputs */

const en_dashboard_quickactions_connectnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build Your ${i?.brand}`)
};

const es_dashboard_quickactions_connectnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crea tu ${i?.brand}`)
};

const fr_dashboard_quickactions_connectnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créez votre ${i?.brand}`)
};

const ar_dashboard_quickactions_connectnewlabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectnewlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنشئ ${i?.brand} الخاص بك`)
};

/**
* | output |
* | --- |
* | "Build Your {brand}" |
*
* @param {Dashboard_Quickactions_Connectnewlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_connectnewlabel3 = /** @type {((inputs: Dashboard_Quickactions_Connectnewlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Connectnewlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_connectnewlabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_connectnewlabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_connectnewlabel3(inputs)
	return ar_dashboard_quickactions_connectnewlabel3(inputs)
});
export { dashboard_quickactions_connectnewlabel3 as "dashboard.quickActions.connectNewLabel" }