/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Basicinfo_Expirationdate2Inputs */

const en_boost_cms_basicinfo_expirationdate2 = /** @type {(inputs: Boost_Cms_Basicinfo_Expirationdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

const es_boost_cms_basicinfo_expirationdate2 = /** @type {(inputs: Boost_Cms_Basicinfo_Expirationdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de caducidad`)
};

const fr_boost_cms_basicinfo_expirationdate2 = /** @type {(inputs: Boost_Cms_Basicinfo_Expirationdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'expiration`)
};

const ar_boost_cms_basicinfo_expirationdate2 = /** @type {(inputs: Boost_Cms_Basicinfo_Expirationdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Boost_Cms_Basicinfo_Expirationdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_basicinfo_expirationdate2 = /** @type {((inputs?: Boost_Cms_Basicinfo_Expirationdate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Basicinfo_Expirationdate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_basicinfo_expirationdate2(inputs)
	if (locale === "es") return es_boost_cms_basicinfo_expirationdate2(inputs)
	if (locale === "fr") return fr_boost_cms_basicinfo_expirationdate2(inputs)
	return ar_boost_cms_basicinfo_expirationdate2(inputs)
});
export { boost_cms_basicinfo_expirationdate2 as "boost.cms.basicInfo.expirationDate" }