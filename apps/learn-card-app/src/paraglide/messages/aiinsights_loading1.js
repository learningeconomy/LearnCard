/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Loading1Inputs */

const en_aiinsights_loading1 = /** @type {(inputs: Aiinsights_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_aiinsights_loading1 = /** @type {(inputs: Aiinsights_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_aiinsights_loading1 = /** @type {(inputs: Aiinsights_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_aiinsights_loading1 = /** @type {(inputs: Aiinsights_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري التحميل`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Aiinsights_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_loading1 = /** @type {((inputs?: Aiinsights_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_loading1(inputs)
	if (locale === "es") return es_aiinsights_loading1(inputs)
	if (locale === "fr") return fr_aiinsights_loading1(inputs)
	return ar_aiinsights_loading1(inputs)
});
export { aiinsights_loading1 as "aiInsights.loading" }