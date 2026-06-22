/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Browsetopicsplaceholder2Inputs */

const en_ai_browsetopicsplaceholder2 = /** @type {(inputs: Ai_Browsetopicsplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse topics...`)
};

const es_ai_browsetopicsplaceholder2 = /** @type {(inputs: Ai_Browsetopicsplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar temas...`)
};

const fr_ai_browsetopicsplaceholder2 = /** @type {(inputs: Ai_Browsetopicsplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les sujets...`)
};

const ar_ai_browsetopicsplaceholder2 = /** @type {(inputs: Ai_Browsetopicsplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح المواضيع...`)
};

/**
* | output |
* | --- |
* | "Browse topics..." |
*
* @param {Ai_Browsetopicsplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_browsetopicsplaceholder2 = /** @type {((inputs?: Ai_Browsetopicsplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Browsetopicsplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_browsetopicsplaceholder2(inputs)
	if (locale === "es") return es_ai_browsetopicsplaceholder2(inputs)
	if (locale === "fr") return fr_ai_browsetopicsplaceholder2(inputs)
	return ar_ai_browsetopicsplaceholder2(inputs)
});
export { ai_browsetopicsplaceholder2 as "ai.browseTopicsPlaceholder" }