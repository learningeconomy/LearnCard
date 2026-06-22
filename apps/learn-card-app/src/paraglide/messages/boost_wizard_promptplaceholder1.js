/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Promptplaceholder1Inputs */

const en_boost_wizard_promptplaceholder1 = /** @type {(inputs: Boost_Wizard_Promptplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write prompt...`)
};

const es_boost_wizard_promptplaceholder1 = /** @type {(inputs: Boost_Wizard_Promptplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escribe un mensaje...`)
};

const fr_boost_wizard_promptplaceholder1 = /** @type {(inputs: Boost_Wizard_Promptplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écrire un message...`)
};

const ar_boost_wizard_promptplaceholder1 = /** @type {(inputs: Boost_Wizard_Promptplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتب موجّهًا...`)
};

/**
* | output |
* | --- |
* | "Write prompt..." |
*
* @param {Boost_Wizard_Promptplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_promptplaceholder1 = /** @type {((inputs?: Boost_Wizard_Promptplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Promptplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_promptplaceholder1(inputs)
	if (locale === "es") return es_boost_wizard_promptplaceholder1(inputs)
	if (locale === "fr") return fr_boost_wizard_promptplaceholder1(inputs)
	return ar_boost_wizard_promptplaceholder1(inputs)
});
export { boost_wizard_promptplaceholder1 as "boost.wizard.promptPlaceholder" }