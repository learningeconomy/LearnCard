/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Openapp2Inputs */

const en_datasharing_openapp2 = /** @type {(inputs: Datasharing_Openapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open App`)
};

const es_datasharing_openapp2 = /** @type {(inputs: Datasharing_Openapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir aplicación`)
};

const fr_datasharing_openapp2 = /** @type {(inputs: Datasharing_Openapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir l'application`)
};

const ar_datasharing_openapp2 = /** @type {(inputs: Datasharing_Openapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح التطبيق`)
};

/**
* | output |
* | --- |
* | "Open App" |
*
* @param {Datasharing_Openapp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_openapp2 = /** @type {((inputs?: Datasharing_Openapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Openapp2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_openapp2(inputs)
	if (locale === "es") return es_datasharing_openapp2(inputs)
	if (locale === "fr") return fr_datasharing_openapp2(inputs)
	return ar_datasharing_openapp2(inputs)
});
export { datasharing_openapp2 as "dataSharing.openApp" }