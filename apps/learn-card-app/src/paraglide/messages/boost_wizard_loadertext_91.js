/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_91Inputs */

const en_boost_wizard_loadertext_91 = /** @type {(inputs: Boost_Wizard_Loadertext_91Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Almost there...`)
};

const es_boost_wizard_loadertext_91 = /** @type {(inputs: Boost_Wizard_Loadertext_91Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya casi está...`)
};

const fr_boost_wizard_loadertext_91 = /** @type {(inputs: Boost_Wizard_Loadertext_91Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Presque terminé...`)
};

const ar_boost_wizard_loadertext_91 = /** @type {(inputs: Boost_Wizard_Loadertext_91Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أوشكنا على الانتهاء...`)
};

/**
* | output |
* | --- |
* | "Almost there..." |
*
* @param {Boost_Wizard_Loadertext_91Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_91 = /** @type {((inputs?: Boost_Wizard_Loadertext_91Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_91Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_91(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_91(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_91(inputs)
	return ar_boost_wizard_loadertext_91(inputs)
});
export { boost_wizard_loadertext_91 as "boost.wizard.loaderText.9" }