/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_11Inputs */

const en_boost_wizard_loadertext_11 = /** @type {(inputs: Boost_Wizard_Loadertext_11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spinning up your smart credential...`)
};

const es_boost_wizard_loadertext_11 = /** @type {(inputs: Boost_Wizard_Loadertext_11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparando tu credencial inteligente...`)
};

const fr_boost_wizard_loadertext_11 = /** @type {(inputs: Boost_Wizard_Loadertext_11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de votre justificatif intelligent...`)
};

const ar_boost_wizard_loadertext_11 = /** @type {(inputs: Boost_Wizard_Loadertext_11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تجهيز شهادتك الذكية...`)
};

/**
* | output |
* | --- |
* | "Spinning up your smart credential..." |
*
* @param {Boost_Wizard_Loadertext_11Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_11 = /** @type {((inputs?: Boost_Wizard_Loadertext_11Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_11Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_11(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_11(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_11(inputs)
	return ar_boost_wizard_loadertext_11(inputs)
});
export { boost_wizard_loadertext_11 as "boost.wizard.loaderText.1" }