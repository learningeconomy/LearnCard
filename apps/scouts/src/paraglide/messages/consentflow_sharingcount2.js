/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sharingcount2Inputs */

const en_consentflow_sharingcount2 = /** @type {(inputs: Consentflow_Sharingcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing {count}/{total}`)
};

const es_consentflow_sharingcount2 = /** @type {(inputs: Consentflow_Sharingcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartiendo {count}/{total}`)
};

const fr_consentflow_sharingcount2 = /** @type {(inputs: Consentflow_Sharingcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage {count}/{total}`)
};

const ar_consentflow_sharingcount2 = /** @type {(inputs: Consentflow_Sharingcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing {count}/{total}`)
};

/**
* | output |
* | --- |
* | "Sharing {count}/{total}" |
*
* @param {Consentflow_Sharingcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_sharingcount2 = /** @type {((inputs?: Consentflow_Sharingcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sharingcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sharingcount2(inputs)
	if (locale === "es") return es_consentflow_sharingcount2(inputs)
	if (locale === "fr") return fr_consentflow_sharingcount2(inputs)
	return ar_consentflow_sharingcount2(inputs)
});
export { consentflow_sharingcount2 as "consentFlow.sharingCount" }