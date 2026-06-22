/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_51Inputs */

const en_boost_wizard_loadertext_51 = /** @type {(inputs: Boost_Wizard_Loadertext_51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Packing it all up...`)
};

const es_boost_wizard_loadertext_51 = /** @type {(inputs: Boost_Wizard_Loadertext_51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empaquetándolo todo...`)
};

const fr_boost_wizard_loadertext_51 = /** @type {(inputs: Boost_Wizard_Loadertext_51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`On rassemble le tout...`)
};

const ar_boost_wizard_loadertext_51 = /** @type {(inputs: Boost_Wizard_Loadertext_51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تجميع كل شيء...`)
};

/**
* | output |
* | --- |
* | "Packing it all up..." |
*
* @param {Boost_Wizard_Loadertext_51Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_51 = /** @type {((inputs?: Boost_Wizard_Loadertext_51Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_51Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_51(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_51(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_51(inputs)
	return ar_boost_wizard_loadertext_51(inputs)
});
export { boost_wizard_loadertext_51 as "boost.wizard.loaderText.5" }