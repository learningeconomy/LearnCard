/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Connectactivelabel3Inputs */

const en_dashboard_quickactions_connectactivelabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectactivelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See Passport`)
};

const es_dashboard_quickactions_connectactivelabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectactivelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver pasaporte`)
};

const fr_dashboard_quickactions_connectactivelabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectactivelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le passeport`)
};

const ar_dashboard_quickactions_connectactivelabel3 = /** @type {(inputs: Dashboard_Quickactions_Connectactivelabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض جواز السفر`)
};

/**
* | output |
* | --- |
* | "See Passport" |
*
* @param {Dashboard_Quickactions_Connectactivelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_connectactivelabel3 = /** @type {((inputs?: Dashboard_Quickactions_Connectactivelabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Connectactivelabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_connectactivelabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_connectactivelabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_connectactivelabel3(inputs)
	return ar_dashboard_quickactions_connectactivelabel3(inputs)
});
export { dashboard_quickactions_connectactivelabel3 as "dashboard.quickActions.connectActiveLabel" }