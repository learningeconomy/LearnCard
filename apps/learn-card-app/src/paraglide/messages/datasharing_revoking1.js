/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Revoking1Inputs */

const en_datasharing_revoking1 = /** @type {(inputs: Datasharing_Revoking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoking...`)
};

const es_datasharing_revoking1 = /** @type {(inputs: Datasharing_Revoking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocando...`)
};

const fr_datasharing_revoking1 = /** @type {(inputs: Datasharing_Revoking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révocation...`)
};

const ar_datasharing_revoking1 = /** @type {(inputs: Datasharing_Revoking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإلغاء...`)
};

/**
* | output |
* | --- |
* | "Revoking..." |
*
* @param {Datasharing_Revoking1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_revoking1 = /** @type {((inputs?: Datasharing_Revoking1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Revoking1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_revoking1(inputs)
	if (locale === "es") return es_datasharing_revoking1(inputs)
	if (locale === "fr") return fr_datasharing_revoking1(inputs)
	return ar_datasharing_revoking1(inputs)
});
export { datasharing_revoking1 as "dataSharing.revoking" }