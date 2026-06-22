/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_PersonalizeInputs */

const en_ai_personalize = /** @type {(inputs: Ai_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalize`)
};

const es_ai_personalize = /** @type {(inputs: Ai_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizar`)
};

const fr_ai_personalize = /** @type {(inputs: Ai_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser`)
};

const ar_ai_personalize = /** @type {(inputs: Ai_PersonalizeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص`)
};

/**
* | output |
* | --- |
* | "Personalize" |
*
* @param {Ai_PersonalizeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_personalize = /** @type {((inputs?: Ai_PersonalizeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_PersonalizeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_personalize(inputs)
	if (locale === "es") return es_ai_personalize(inputs)
	if (locale === "fr") return fr_ai_personalize(inputs)
	return ar_ai_personalize(inputs)
});
export { ai_personalize as "ai.personalize" }