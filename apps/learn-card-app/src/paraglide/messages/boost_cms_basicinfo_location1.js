/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Basicinfo_Location1Inputs */

const en_boost_cms_basicinfo_location1 = /** @type {(inputs: Boost_Cms_Basicinfo_Location1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Location`)
};

const es_boost_cms_basicinfo_location1 = /** @type {(inputs: Boost_Cms_Basicinfo_Location1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ubicación`)
};

const fr_boost_cms_basicinfo_location1 = /** @type {(inputs: Boost_Cms_Basicinfo_Location1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emplacement`)
};

const ar_boost_cms_basicinfo_location1 = /** @type {(inputs: Boost_Cms_Basicinfo_Location1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموقع`)
};

/**
* | output |
* | --- |
* | "Location" |
*
* @param {Boost_Cms_Basicinfo_Location1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_basicinfo_location1 = /** @type {((inputs?: Boost_Cms_Basicinfo_Location1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Basicinfo_Location1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_basicinfo_location1(inputs)
	if (locale === "es") return es_boost_cms_basicinfo_location1(inputs)
	if (locale === "fr") return fr_boost_cms_basicinfo_location1(inputs)
	return ar_boost_cms_basicinfo_location1(inputs)
});
export { boost_cms_basicinfo_location1 as "boost.cms.basicInfo.location" }