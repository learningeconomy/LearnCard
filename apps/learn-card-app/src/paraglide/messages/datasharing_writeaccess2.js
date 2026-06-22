/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Writeaccess2Inputs */

const en_datasharing_writeaccess2 = /** @type {(inputs: Datasharing_Writeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write Access`)
};

const es_datasharing_writeaccess2 = /** @type {(inputs: Datasharing_Writeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de escritura`)
};

const fr_datasharing_writeaccess2 = /** @type {(inputs: Datasharing_Writeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en écriture`)
};

const ar_datasharing_writeaccess2 = /** @type {(inputs: Datasharing_Writeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول الكتابة`)
};

/**
* | output |
* | --- |
* | "Write Access" |
*
* @param {Datasharing_Writeaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_writeaccess2 = /** @type {((inputs?: Datasharing_Writeaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Writeaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_writeaccess2(inputs)
	if (locale === "es") return es_datasharing_writeaccess2(inputs)
	if (locale === "fr") return fr_datasharing_writeaccess2(inputs)
	return ar_datasharing_writeaccess2(inputs)
});
export { datasharing_writeaccess2 as "dataSharing.writeAccess" }