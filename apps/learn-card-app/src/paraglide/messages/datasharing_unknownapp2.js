/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Unknownapp2Inputs */

const en_datasharing_unknownapp2 = /** @type {(inputs: Datasharing_Unknownapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown App`)
};

const es_datasharing_unknownapp2 = /** @type {(inputs: Datasharing_Unknownapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicación desconocida`)
};

const fr_datasharing_unknownapp2 = /** @type {(inputs: Datasharing_Unknownapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application inconnue`)
};

const ar_datasharing_unknownapp2 = /** @type {(inputs: Datasharing_Unknownapp2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيق غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown App" |
*
* @param {Datasharing_Unknownapp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_unknownapp2 = /** @type {((inputs?: Datasharing_Unknownapp2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Unknownapp2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_unknownapp2(inputs)
	if (locale === "es") return es_datasharing_unknownapp2(inputs)
	if (locale === "fr") return fr_datasharing_unknownapp2(inputs)
	return ar_datasharing_unknownapp2(inputs)
});
export { datasharing_unknownapp2 as "dataSharing.unknownApp" }