/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Aipathways_Discovery_Joinbrand2Inputs */

const en_aipathways_discovery_joinbrand2 = /** @type {(inputs: Aipathways_Discovery_Joinbrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Join ${i?.brand}`)
};

const es_aipathways_discovery_joinbrand2 = /** @type {(inputs: Aipathways_Discovery_Joinbrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Únete a ${i?.brand}`)
};

const fr_aipathways_discovery_joinbrand2 = /** @type {(inputs: Aipathways_Discovery_Joinbrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rejoignez ${i?.brand}`)
};

const ar_aipathways_discovery_joinbrand2 = /** @type {(inputs: Aipathways_Discovery_Joinbrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`انضم إلى ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Join {brand}" |
*
* @param {Aipathways_Discovery_Joinbrand2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_joinbrand2 = /** @type {((inputs: Aipathways_Discovery_Joinbrand2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Joinbrand2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_joinbrand2(inputs)
	if (locale === "es") return es_aipathways_discovery_joinbrand2(inputs)
	if (locale === "fr") return fr_aipathways_discovery_joinbrand2(inputs)
	return ar_aipathways_discovery_joinbrand2(inputs)
});
export { aipathways_discovery_joinbrand2 as "aiPathways.discovery.joinBrand" }