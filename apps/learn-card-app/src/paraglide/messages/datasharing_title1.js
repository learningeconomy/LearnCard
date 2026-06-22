/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Title1Inputs */

const en_datasharing_title1 = /** @type {(inputs: Datasharing_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Data Sharing`)
};

const es_datasharing_title1 = /** @type {(inputs: Datasharing_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uso compartido de datos`)
};

const fr_datasharing_title1 = /** @type {(inputs: Datasharing_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage de données`)
};

const ar_datasharing_title1 = /** @type {(inputs: Datasharing_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة البيانات`)
};

/**
* | output |
* | --- |
* | "Data Sharing" |
*
* @param {Datasharing_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_title1 = /** @type {((inputs?: Datasharing_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_title1(inputs)
	if (locale === "es") return es_datasharing_title1(inputs)
	if (locale === "fr") return fr_datasharing_title1(inputs)
	return ar_datasharing_title1(inputs)
});
export { datasharing_title1 as "dataSharing.title" }