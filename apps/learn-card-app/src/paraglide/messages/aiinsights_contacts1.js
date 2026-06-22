/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Contacts1Inputs */

const en_aiinsights_contacts1 = /** @type {(inputs: Aiinsights_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_aiinsights_contacts1 = /** @type {(inputs: Aiinsights_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_aiinsights_contacts1 = /** @type {(inputs: Aiinsights_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_aiinsights_contacts1 = /** @type {(inputs: Aiinsights_Contacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Aiinsights_Contacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_contacts1 = /** @type {((inputs?: Aiinsights_Contacts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Contacts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_contacts1(inputs)
	if (locale === "es") return es_aiinsights_contacts1(inputs)
	if (locale === "fr") return fr_aiinsights_contacts1(inputs)
	return ar_aiinsights_contacts1(inputs)
});
export { aiinsights_contacts1 as "aiInsights.contacts" }