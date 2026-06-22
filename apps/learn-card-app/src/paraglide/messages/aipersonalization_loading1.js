/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Loading1Inputs */

const en_aipersonalization_loading1 = /** @type {(inputs: Aipersonalization_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading Personalization...`)
};

const es_aipersonalization_loading1 = /** @type {(inputs: Aipersonalization_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando personalización...`)
};

const fr_aipersonalization_loading1 = /** @type {(inputs: Aipersonalization_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement de la personnalisation...`)
};

const ar_aipersonalization_loading1 = /** @type {(inputs: Aipersonalization_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل التخصيص...`)
};

/**
* | output |
* | --- |
* | "Loading Personalization..." |
*
* @param {Aipersonalization_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_loading1 = /** @type {((inputs?: Aipersonalization_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_loading1(inputs)
	if (locale === "es") return es_aipersonalization_loading1(inputs)
	if (locale === "fr") return fr_aipersonalization_loading1(inputs)
	return ar_aipersonalization_loading1(inputs)
});
export { aipersonalization_loading1 as "aiPersonalization.loading" }