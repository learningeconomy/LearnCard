/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Advanced_Expirationdate1Inputs */

const en_boost_cms_advanced_expirationdate1 = /** @type {(inputs: Boost_Cms_Advanced_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

const es_boost_cms_advanced_expirationdate1 = /** @type {(inputs: Boost_Cms_Advanced_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de caducidad`)
};

const fr_boost_cms_advanced_expirationdate1 = /** @type {(inputs: Boost_Cms_Advanced_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'expiration`)
};

const ar_boost_cms_advanced_expirationdate1 = /** @type {(inputs: Boost_Cms_Advanced_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Boost_Cms_Advanced_Expirationdate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_expirationdate1 = /** @type {((inputs?: Boost_Cms_Advanced_Expirationdate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_Expirationdate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_expirationdate1(inputs)
	if (locale === "es") return es_boost_cms_advanced_expirationdate1(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_expirationdate1(inputs)
	return ar_boost_cms_advanced_expirationdate1(inputs)
});
export { boost_cms_advanced_expirationdate1 as "boost.cms.advanced.expirationDate" }