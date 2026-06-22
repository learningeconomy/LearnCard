/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Nocontacts2Inputs */

const en_aiinsights_nocontacts2 = /** @type {(inputs: Aiinsights_Nocontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Contacts`)
};

const es_aiinsights_nocontacts2 = /** @type {(inputs: Aiinsights_Nocontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin contactos`)
};

const fr_aiinsights_nocontacts2 = /** @type {(inputs: Aiinsights_Nocontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun contact`)
};

const ar_aiinsights_nocontacts2 = /** @type {(inputs: Aiinsights_Nocontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد جهات اتصال`)
};

/**
* | output |
* | --- |
* | "No Contacts" |
*
* @param {Aiinsights_Nocontacts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_nocontacts2 = /** @type {((inputs?: Aiinsights_Nocontacts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Nocontacts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_nocontacts2(inputs)
	if (locale === "es") return es_aiinsights_nocontacts2(inputs)
	if (locale === "fr") return fr_aiinsights_nocontacts2(inputs)
	return ar_aiinsights_nocontacts2(inputs)
});
export { aiinsights_nocontacts2 as "aiInsights.noContacts" }