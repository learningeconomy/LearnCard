/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Continueissuing1Inputs */

const en_boost_cms_continueissuing1 = /** @type {(inputs: Boost_Cms_Continueissuing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Issuing`)
};

const es_boost_cms_continueissuing1 = /** @type {(inputs: Boost_Cms_Continueissuing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar emitiendo`)
};

const fr_boost_cms_continueissuing1 = /** @type {(inputs: Boost_Cms_Continueissuing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer l'émission`)
};

const ar_boost_cms_continueissuing1 = /** @type {(inputs: Boost_Cms_Continueissuing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة الإصدار`)
};

/**
* | output |
* | --- |
* | "Continue Issuing" |
*
* @param {Boost_Cms_Continueissuing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_continueissuing1 = /** @type {((inputs?: Boost_Cms_Continueissuing1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Continueissuing1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_continueissuing1(inputs)
	if (locale === "es") return es_boost_cms_continueissuing1(inputs)
	if (locale === "fr") return fr_boost_cms_continueissuing1(inputs)
	return ar_boost_cms_continueissuing1(inputs)
});
export { boost_cms_continueissuing1 as "boost.cms.continueIssuing" }