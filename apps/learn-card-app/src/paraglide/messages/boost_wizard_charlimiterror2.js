/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Charlimiterror2Inputs */

const en_boost_wizard_charlimiterror2 = /** @type {(inputs: Boost_Wizard_Charlimiterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have exceeded the 500-character limit.`)
};

const es_boost_wizard_charlimiterror2 = /** @type {(inputs: Boost_Wizard_Charlimiterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has superado el límite de 500 caracteres.`)
};

const fr_boost_wizard_charlimiterror2 = /** @type {(inputs: Boost_Wizard_Charlimiterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez dépassé la limite de 500 caractères.`)
};

const ar_boost_wizard_charlimiterror2 = /** @type {(inputs: Boost_Wizard_Charlimiterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تجاوزت الحد الأقصى البالغ 500 حرف.`)
};

/**
* | output |
* | --- |
* | "You have exceeded the 500-character limit." |
*
* @param {Boost_Wizard_Charlimiterror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_charlimiterror2 = /** @type {((inputs?: Boost_Wizard_Charlimiterror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Charlimiterror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_charlimiterror2(inputs)
	if (locale === "es") return es_boost_wizard_charlimiterror2(inputs)
	if (locale === "fr") return fr_boost_wizard_charlimiterror2(inputs)
	return ar_boost_wizard_charlimiterror2(inputs)
});
export { boost_wizard_charlimiterror2 as "boost.wizard.charLimitError" }