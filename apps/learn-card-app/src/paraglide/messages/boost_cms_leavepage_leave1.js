/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Leavepage_Leave1Inputs */

const en_boost_cms_leavepage_leave1 = /** @type {(inputs: Boost_Cms_Leavepage_Leave1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leave Page`)
};

const es_boost_cms_leavepage_leave1 = /** @type {(inputs: Boost_Cms_Leavepage_Leave1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir de la página`)
};

const fr_boost_cms_leavepage_leave1 = /** @type {(inputs: Boost_Cms_Leavepage_Leave1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter la page`)
};

const ar_boost_cms_leavepage_leave1 = /** @type {(inputs: Boost_Cms_Leavepage_Leave1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مغادرة الصفحة`)
};

/**
* | output |
* | --- |
* | "Leave Page" |
*
* @param {Boost_Cms_Leavepage_Leave1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_leavepage_leave1 = /** @type {((inputs?: Boost_Cms_Leavepage_Leave1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Leavepage_Leave1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_leavepage_leave1(inputs)
	if (locale === "es") return es_boost_cms_leavepage_leave1(inputs)
	if (locale === "fr") return fr_boost_cms_leavepage_leave1(inputs)
	return ar_boost_cms_leavepage_leave1(inputs)
});
export { boost_cms_leavepage_leave1 as "boost.cms.leavePage.leave" }