/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q3_Placeholder1Inputs */

const en_aipersonalization_q3_placeholder1 = /** @type {(inputs: Aipersonalization_Q3_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add movie genre`)
};

const es_aipersonalization_q3_placeholder1 = /** @type {(inputs: Aipersonalization_Q3_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir género de película`)
};

const fr_aipersonalization_q3_placeholder1 = /** @type {(inputs: Aipersonalization_Q3_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un genre de film`)
};

const ar_aipersonalization_q3_placeholder1 = /** @type {(inputs: Aipersonalization_Q3_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف نوع فيلم`)
};

/**
* | output |
* | --- |
* | "Add movie genre" |
*
* @param {Aipersonalization_Q3_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q3_placeholder1 = /** @type {((inputs?: Aipersonalization_Q3_Placeholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q3_Placeholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q3_placeholder1(inputs)
	if (locale === "es") return es_aipersonalization_q3_placeholder1(inputs)
	if (locale === "fr") return fr_aipersonalization_q3_placeholder1(inputs)
	return ar_aipersonalization_q3_placeholder1(inputs)
});
export { aipersonalization_q3_placeholder1 as "aiPersonalization.q3.placeholder" }