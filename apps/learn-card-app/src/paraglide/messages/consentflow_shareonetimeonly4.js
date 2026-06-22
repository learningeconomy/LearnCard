/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Shareonetimeonly4Inputs */

const en_consentflow_shareonetimeonly4 = /** @type {(inputs: Consentflow_Shareonetimeonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share One Time Only`)
};

const es_consentflow_shareonetimeonly4 = /** @type {(inputs: Consentflow_Shareonetimeonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir solo una vez`)
};

const fr_consentflow_shareonetimeonly4 = /** @type {(inputs: Consentflow_Shareonetimeonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager une seule fois`)
};

const ar_consentflow_shareonetimeonly4 = /** @type {(inputs: Consentflow_Shareonetimeonly4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة مرة واحدة فقط`)
};

/**
* | output |
* | --- |
* | "Share One Time Only" |
*
* @param {Consentflow_Shareonetimeonly4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_shareonetimeonly4 = /** @type {((inputs?: Consentflow_Shareonetimeonly4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Shareonetimeonly4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_shareonetimeonly4(inputs)
	if (locale === "es") return es_consentflow_shareonetimeonly4(inputs)
	if (locale === "fr") return fr_consentflow_shareonetimeonly4(inputs)
	return ar_consentflow_shareonetimeonly4(inputs)
});
export { consentflow_shareonetimeonly4 as "consentFlow.shareOneTimeOnly" }