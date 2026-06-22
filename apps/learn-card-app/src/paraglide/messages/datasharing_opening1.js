/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Opening1Inputs */

const en_datasharing_opening1 = /** @type {(inputs: Datasharing_Opening1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opening...`)
};

const es_datasharing_opening1 = /** @type {(inputs: Datasharing_Opening1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abriendo...`)
};

const fr_datasharing_opening1 = /** @type {(inputs: Datasharing_Opening1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouverture...`)
};

const ar_datasharing_opening1 = /** @type {(inputs: Datasharing_Opening1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الفتح...`)
};

/**
* | output |
* | --- |
* | "Opening..." |
*
* @param {Datasharing_Opening1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_opening1 = /** @type {((inputs?: Datasharing_Opening1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Opening1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_opening1(inputs)
	if (locale === "es") return es_datasharing_opening1(inputs)
	if (locale === "fr") return fr_datasharing_opening1(inputs)
	return ar_datasharing_opening1(inputs)
});
export { datasharing_opening1 as "dataSharing.opening" }