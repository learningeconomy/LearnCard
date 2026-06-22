/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q2_Placeholder1Inputs */

const en_aipersonalization_q2_placeholder1 = /** @type {(inputs: Aipersonalization_Q2_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add fictional character`)
};

const es_aipersonalization_q2_placeholder1 = /** @type {(inputs: Aipersonalization_Q2_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir personaje ficticio`)
};

const fr_aipersonalization_q2_placeholder1 = /** @type {(inputs: Aipersonalization_Q2_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un personnage de fiction`)
};

const ar_aipersonalization_q2_placeholder1 = /** @type {(inputs: Aipersonalization_Q2_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف شخصية خيالية`)
};

/**
* | output |
* | --- |
* | "Add fictional character" |
*
* @param {Aipersonalization_Q2_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q2_placeholder1 = /** @type {((inputs?: Aipersonalization_Q2_Placeholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q2_Placeholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q2_placeholder1(inputs)
	if (locale === "es") return es_aipersonalization_q2_placeholder1(inputs)
	if (locale === "fr") return fr_aipersonalization_q2_placeholder1(inputs)
	return ar_aipersonalization_q2_placeholder1(inputs)
});
export { aipersonalization_q2_placeholder1 as "aiPersonalization.q2.placeholder" }