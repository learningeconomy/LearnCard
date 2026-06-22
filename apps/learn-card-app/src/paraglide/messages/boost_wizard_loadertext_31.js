/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_31Inputs */

const en_boost_wizard_loadertext_31 = /** @type {(inputs: Boost_Wizard_Loadertext_31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sealing your achievement...`)
};

const es_boost_wizard_loadertext_31 = /** @type {(inputs: Boost_Wizard_Loadertext_31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sellando tu logro...`)
};

const fr_boost_wizard_loadertext_31 = /** @type {(inputs: Boost_Wizard_Loadertext_31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Validation de votre réussite...`)
};

const ar_boost_wizard_loadertext_31 = /** @type {(inputs: Boost_Wizard_Loadertext_31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ توثيق إنجازك...`)
};

/**
* | output |
* | --- |
* | "Sealing your achievement..." |
*
* @param {Boost_Wizard_Loadertext_31Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_31 = /** @type {((inputs?: Boost_Wizard_Loadertext_31Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_31Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_31(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_31(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_31(inputs)
	return ar_boost_wizard_loadertext_31(inputs)
});
export { boost_wizard_loadertext_31 as "boost.wizard.loaderText.3" }