/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_21Inputs */

const en_boost_wizard_loadertext_21 = /** @type {(inputs: Boost_Wizard_Loadertext_21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating your credential...`)
};

const es_boost_wizard_loadertext_21 = /** @type {(inputs: Boost_Wizard_Loadertext_21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando tu credencial...`)
};

const fr_boost_wizard_loadertext_21 = /** @type {(inputs: Boost_Wizard_Loadertext_21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération de votre justificatif...`)
};

const ar_boost_wizard_loadertext_21 = /** @type {(inputs: Boost_Wizard_Loadertext_21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء شهادتك...`)
};

/**
* | output |
* | --- |
* | "Generating your credential..." |
*
* @param {Boost_Wizard_Loadertext_21Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_21 = /** @type {((inputs?: Boost_Wizard_Loadertext_21Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_21Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_21(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_21(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_21(inputs)
	return ar_boost_wizard_loadertext_21(inputs)
});
export { boost_wizard_loadertext_21 as "boost.wizard.loaderText.2" }