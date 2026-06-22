/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allowall2Inputs */

const en_consentflow_allowall2 = /** @type {(inputs: Consentflow_Allowall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allow All`)
};

const es_consentflow_allowall2 = /** @type {(inputs: Consentflow_Allowall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permitir todo`)
};

const fr_consentflow_allowall2 = /** @type {(inputs: Consentflow_Allowall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout autoriser`)
};

const ar_consentflow_allowall2 = /** @type {(inputs: Consentflow_Allowall2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح بالكل`)
};

/**
* | output |
* | --- |
* | "Allow All" |
*
* @param {Consentflow_Allowall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allowall2 = /** @type {((inputs?: Consentflow_Allowall2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowall2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowall2(inputs)
	if (locale === "es") return es_consentflow_allowall2(inputs)
	if (locale === "fr") return fr_consentflow_allowall2(inputs)
	return ar_consentflow_allowall2(inputs)
});
export { consentflow_allowall2 as "consentFlow.allowAll" }