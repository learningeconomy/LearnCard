/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Header_ConfirmationInputs */

const en_boost_cms_header_confirmation = /** @type {(inputs: Boost_Cms_Header_ConfirmationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmation`)
};

const es_boost_cms_header_confirmation = /** @type {(inputs: Boost_Cms_Header_ConfirmationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmación`)
};

const fr_boost_cms_header_confirmation = /** @type {(inputs: Boost_Cms_Header_ConfirmationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmation`)
};

const ar_boost_cms_header_confirmation = /** @type {(inputs: Boost_Cms_Header_ConfirmationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكيد`)
};

/**
* | output |
* | --- |
* | "Confirmation" |
*
* @param {Boost_Cms_Header_ConfirmationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_header_confirmation = /** @type {((inputs?: Boost_Cms_Header_ConfirmationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Header_ConfirmationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_header_confirmation(inputs)
	if (locale === "es") return es_boost_cms_header_confirmation(inputs)
	if (locale === "fr") return fr_boost_cms_header_confirmation(inputs)
	return ar_boost_cms_header_confirmation(inputs)
});
export { boost_cms_header_confirmation as "boost.cms.header.confirmation" }