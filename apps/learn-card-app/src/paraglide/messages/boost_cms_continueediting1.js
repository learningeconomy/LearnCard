/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Continueediting1Inputs */

const en_boost_cms_continueediting1 = /** @type {(inputs: Boost_Cms_Continueediting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_boost_cms_continueediting1 = /** @type {(inputs: Boost_Cms_Continueediting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar editando`)
};

const fr_boost_cms_continueediting1 = /** @type {(inputs: Boost_Cms_Continueediting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la modification`)
};

const ar_boost_cms_continueediting1 = /** @type {(inputs: Boost_Cms_Continueediting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة التحرير`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Boost_Cms_Continueediting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_continueediting1 = /** @type {((inputs?: Boost_Cms_Continueediting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Continueediting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_continueediting1(inputs)
	if (locale === "es") return es_boost_cms_continueediting1(inputs)
	if (locale === "fr") return fr_boost_cms_continueediting1(inputs)
	return ar_boost_cms_continueediting1(inputs)
});
export { boost_cms_continueediting1 as "boost.cms.continueEditing" }