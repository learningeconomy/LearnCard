/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Readaccess2Inputs */

const en_datasharing_readaccess2 = /** @type {(inputs: Datasharing_Readaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Access`)
};

const es_datasharing_readaccess2 = /** @type {(inputs: Datasharing_Readaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de lectura`)
};

const fr_datasharing_readaccess2 = /** @type {(inputs: Datasharing_Readaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en lecture`)
};

const ar_datasharing_readaccess2 = /** @type {(inputs: Datasharing_Readaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول القراءة`)
};

/**
* | output |
* | --- |
* | "Read Access" |
*
* @param {Datasharing_Readaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_readaccess2 = /** @type {((inputs?: Datasharing_Readaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Readaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_readaccess2(inputs)
	if (locale === "es") return es_datasharing_readaccess2(inputs)
	if (locale === "fr") return fr_datasharing_readaccess2(inputs)
	return ar_datasharing_readaccess2(inputs)
});
export { datasharing_readaccess2 as "dataSharing.readAccess" }