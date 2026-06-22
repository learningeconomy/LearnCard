/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Datasharing_Readcount2Inputs */

const en_datasharing_readcount2 = /** @type {(inputs: Datasharing_Readcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} read`)
};

const es_datasharing_readcount2 = /** @type {(inputs: Datasharing_Readcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} de lectura`)
};

const fr_datasharing_readcount2 = /** @type {(inputs: Datasharing_Readcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} en lecture`)
};

const ar_datasharing_readcount2 = /** @type {(inputs: Datasharing_Readcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} قراءة`)
};

/**
* | output |
* | --- |
* | "{count} read" |
*
* @param {Datasharing_Readcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_readcount2 = /** @type {((inputs: Datasharing_Readcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Readcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_readcount2(inputs)
	if (locale === "es") return es_datasharing_readcount2(inputs)
	if (locale === "fr") return fr_datasharing_readcount2(inputs)
	return ar_datasharing_readcount2(inputs)
});
export { datasharing_readcount2 as "dataSharing.readCount" }