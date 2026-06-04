/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Nothingfound2Inputs */

const en_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nothing Found`)
};

const es_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró nada`)
};

const de_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nichts gefunden`)
};

const ar_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على شيء`)
};

const fr_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rien trouvé`)
};

const ko_consentflow_nothingfound2 = /** @type {(inputs: Consentflow_Nothingfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`결과 없음`)
};

/**
* | output |
* | --- |
* | "Nothing Found" |
*
* @param {Consentflow_Nothingfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_nothingfound2 = /** @type {((inputs?: Consentflow_Nothingfound2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Nothingfound2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_nothingfound2(inputs)
	if (locale === "es") return es_consentflow_nothingfound2(inputs)
	if (locale === "de") return de_consentflow_nothingfound2(inputs)
	if (locale === "ar") return ar_consentflow_nothingfound2(inputs)
	if (locale === "fr") return fr_consentflow_nothingfound2(inputs)
	return ko_consentflow_nothingfound2(inputs)
});
export { consentflow_nothingfound2 as "consentFlow.nothingFound" }