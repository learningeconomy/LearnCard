/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, title: NonNullable<unknown> }} Aiinsights_Aboutcount2Inputs */

const en_aiinsights_aboutcount2 = /** @type {(inputs: Aiinsights_Aboutcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`About ${i?.count} ${i?.title} worldwide`)
};

const es_aiinsights_aboutcount2 = /** @type {(inputs: Aiinsights_Aboutcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aproximadamente ${i?.count} ${i?.title} en el mundo`)
};

const fr_aiinsights_aboutcount2 = /** @type {(inputs: Aiinsights_Aboutcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Environ ${i?.count} ${i?.title} dans le monde`)
};

const ar_aiinsights_aboutcount2 = /** @type {(inputs: Aiinsights_Aboutcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حوالي ${i?.count} ${i?.title} حول العالم`)
};

/**
* | output |
* | --- |
* | "About {count} {title} worldwide" |
*
* @param {Aiinsights_Aboutcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_aboutcount2 = /** @type {((inputs: Aiinsights_Aboutcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Aboutcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_aboutcount2(inputs)
	if (locale === "es") return es_aiinsights_aboutcount2(inputs)
	if (locale === "fr") return fr_aiinsights_aboutcount2(inputs)
	return ar_aiinsights_aboutcount2(inputs)
});
export { aiinsights_aboutcount2 as "aiInsights.aboutCount" }