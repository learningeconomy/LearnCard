/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Advanced_LocationInputs */

const en_boost_cms_advanced_location = /** @type {(inputs: Boost_Cms_Advanced_LocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Location`)
};

const es_boost_cms_advanced_location = /** @type {(inputs: Boost_Cms_Advanced_LocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ubicación`)
};

const fr_boost_cms_advanced_location = /** @type {(inputs: Boost_Cms_Advanced_LocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emplacement`)
};

const ar_boost_cms_advanced_location = /** @type {(inputs: Boost_Cms_Advanced_LocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموقع`)
};

/**
* | output |
* | --- |
* | "Location" |
*
* @param {Boost_Cms_Advanced_LocationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_location = /** @type {((inputs?: Boost_Cms_Advanced_LocationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_LocationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_location(inputs)
	if (locale === "es") return es_boost_cms_advanced_location(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_location(inputs)
	return ar_boost_cms_advanced_location(inputs)
});
export { boost_cms_advanced_location as "boost.cms.advanced.location" }