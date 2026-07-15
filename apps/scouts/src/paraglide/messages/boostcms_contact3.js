/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Contact3Inputs */

const en_boostcms_contact3 = /** @type {(inputs: Boostcms_Contact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const es_boostcms_contact3 = /** @type {(inputs: Boostcms_Contact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacto`)
};

const fr_boostcms_contact3 = /** @type {(inputs: Boostcms_Contact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const ar_boostcms_contact3 = /** @type {(inputs: Boostcms_Contact3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهة اتصال`)
};

/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Boostcms_Contact3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_contact3 = /** @type {((inputs?: Boostcms_Contact3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Contact3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_contact3(inputs)
	if (locale === "es") return es_boostcms_contact3(inputs)
	if (locale === "fr") return fr_boostcms_contact3(inputs)
	return ar_boostcms_contact3(inputs)
});
export { boostcms_contact3 as "boostCMS.contact" }