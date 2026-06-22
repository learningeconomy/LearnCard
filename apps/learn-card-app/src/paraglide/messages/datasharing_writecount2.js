/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Datasharing_Writecount2Inputs */

const en_datasharing_writecount2 = /** @type {(inputs: Datasharing_Writecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} write`)
};

const es_datasharing_writecount2 = /** @type {(inputs: Datasharing_Writecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} de escritura`)
};

const fr_datasharing_writecount2 = /** @type {(inputs: Datasharing_Writecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} en écriture`)
};

const ar_datasharing_writecount2 = /** @type {(inputs: Datasharing_Writecount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} كتابة`)
};

/**
* | output |
* | --- |
* | "{count} write" |
*
* @param {Datasharing_Writecount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_writecount2 = /** @type {((inputs: Datasharing_Writecount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Writecount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_writecount2(inputs)
	if (locale === "es") return es_datasharing_writecount2(inputs)
	if (locale === "fr") return fr_datasharing_writecount2(inputs)
	return ar_datasharing_writecount2(inputs)
});
export { datasharing_writecount2 as "dataSharing.writeCount" }