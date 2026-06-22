/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Discovery_Entercareerkeyword3Inputs */

const en_aipathways_discovery_entercareerkeyword3 = /** @type {(inputs: Aipathways_Discovery_Entercareerkeyword3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter a career keyword`)
};

const es_aipathways_discovery_entercareerkeyword3 = /** @type {(inputs: Aipathways_Discovery_Entercareerkeyword3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Introduce una palabra clave de carrera`)
};

const fr_aipathways_discovery_entercareerkeyword3 = /** @type {(inputs: Aipathways_Discovery_Entercareerkeyword3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez un mot-clé de carrière`)
};

const ar_aipathways_discovery_entercareerkeyword3 = /** @type {(inputs: Aipathways_Discovery_Entercareerkeyword3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل كلمة مفتاحية للمهنة`)
};

/**
* | output |
* | --- |
* | "Enter a career keyword" |
*
* @param {Aipathways_Discovery_Entercareerkeyword3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_entercareerkeyword3 = /** @type {((inputs?: Aipathways_Discovery_Entercareerkeyword3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Entercareerkeyword3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_entercareerkeyword3(inputs)
	if (locale === "es") return es_aipathways_discovery_entercareerkeyword3(inputs)
	if (locale === "fr") return fr_aipathways_discovery_entercareerkeyword3(inputs)
	return ar_aipathways_discovery_entercareerkeyword3(inputs)
});
export { aipathways_discovery_entercareerkeyword3 as "aiPathways.discovery.enterCareerKeyword" }