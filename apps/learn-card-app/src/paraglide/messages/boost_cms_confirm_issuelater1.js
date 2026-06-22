/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Confirm_Issuelater1Inputs */

const en_boost_cms_confirm_issuelater1 = /** @type {(inputs: Boost_Cms_Confirm_Issuelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Later`)
};

const es_boost_cms_confirm_issuelater1 = /** @type {(inputs: Boost_Cms_Confirm_Issuelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir más tarde`)
};

const fr_boost_cms_confirm_issuelater1 = /** @type {(inputs: Boost_Cms_Confirm_Issuelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre plus tard`)
};

const ar_boost_cms_confirm_issuelater1 = /** @type {(inputs: Boost_Cms_Confirm_Issuelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار لاحقًا`)
};

/**
* | output |
* | --- |
* | "Issue Later" |
*
* @param {Boost_Cms_Confirm_Issuelater1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_confirm_issuelater1 = /** @type {((inputs?: Boost_Cms_Confirm_Issuelater1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Confirm_Issuelater1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_confirm_issuelater1(inputs)
	if (locale === "es") return es_boost_cms_confirm_issuelater1(inputs)
	if (locale === "fr") return fr_boost_cms_confirm_issuelater1(inputs)
	return ar_boost_cms_confirm_issuelater1(inputs)
});
export { boost_cms_confirm_issuelater1 as "boost.cms.confirm.issueLater" }