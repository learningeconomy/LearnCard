/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ percent: NonNullable<unknown>, title: NonNullable<unknown> }} Aiinsights_Makemorethan3Inputs */

const en_aiinsights_makemorethan3 = /** @type {(inputs: Aiinsights_Makemorethan3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`It looks like you make more than ${i?.percent}% of other ${i?.title} in the market.`)
};

const es_aiinsights_makemorethan3 = /** @type {(inputs: Aiinsights_Makemorethan3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Parece que ganas más que el ${i?.percent}% de otros ${i?.title} en el mercado.`)
};

const fr_aiinsights_makemorethan3 = /** @type {(inputs: Aiinsights_Makemorethan3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Il semble que vous gagnez plus que ${i?.percent}% des autres ${i?.title} sur le marché.`)
};

const ar_aiinsights_makemorethan3 = /** @type {(inputs: Aiinsights_Makemorethan3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`يبدو أنك تكسب أكثر من ${i?.percent}% من ${i?.title} الآخرين في السوق.`)
};

/**
* | output |
* | --- |
* | "It looks like you make more than {percent}% of other {title} in the market." |
*
* @param {Aiinsights_Makemorethan3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_makemorethan3 = /** @type {((inputs: Aiinsights_Makemorethan3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Makemorethan3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_makemorethan3(inputs)
	if (locale === "es") return es_aiinsights_makemorethan3(inputs)
	if (locale === "fr") return fr_aiinsights_makemorethan3(inputs)
	return ar_aiinsights_makemorethan3(inputs)
});
export { aiinsights_makemorethan3 as "aiInsights.makeMoreThan" }