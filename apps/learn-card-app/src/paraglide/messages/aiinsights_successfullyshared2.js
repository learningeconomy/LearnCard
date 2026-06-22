/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Aiinsights_Successfullyshared2Inputs */

const en_aiinsights_successfullyshared2 = /** @type {(inputs: Aiinsights_Successfullyshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You've successfully shared insights with ${i?.name}`)
};

const es_aiinsights_successfullyshared2 = /** @type {(inputs: Aiinsights_Successfullyshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Has compartido los Insights con ${i?.name} correctamente`)
};

const fr_aiinsights_successfullyshared2 = /** @type {(inputs: Aiinsights_Successfullyshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous avez partagé les Insights avec ${i?.name} avec succès`)
};

const ar_aiinsights_successfullyshared2 = /** @type {(inputs: Aiinsights_Successfullyshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لقد شاركت الرؤى مع ${i?.name} بنجاح`)
};

/**
* | output |
* | --- |
* | "You've successfully shared insights with {name}" |
*
* @param {Aiinsights_Successfullyshared2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_successfullyshared2 = /** @type {((inputs: Aiinsights_Successfullyshared2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Successfullyshared2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_successfullyshared2(inputs)
	if (locale === "es") return es_aiinsights_successfullyshared2(inputs)
	if (locale === "fr") return fr_aiinsights_successfullyshared2(inputs)
	return ar_aiinsights_successfullyshared2(inputs)
});
export { aiinsights_successfullyshared2 as "aiInsights.successfullyShared" }