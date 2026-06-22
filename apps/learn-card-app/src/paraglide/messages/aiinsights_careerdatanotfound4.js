/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Careerdatanotfound4Inputs */

const en_aiinsights_careerdatanotfound4 = /** @type {(inputs: Aiinsights_Careerdatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We could not find career data for this title yet.`)
};

const es_aiinsights_careerdatanotfound4 = /** @type {(inputs: Aiinsights_Careerdatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no encontramos datos de carrera para este título.`)
};

const fr_aiinsights_careerdatanotfound4 = /** @type {(inputs: Aiinsights_Careerdatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas encore trouvé de données de carrière pour ce titre.`)
};

const ar_aiinsights_careerdatanotfound4 = /** @type {(inputs: Aiinsights_Careerdatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من العثور على بيانات مهنة لهذا المسمى بعد.`)
};

/**
* | output |
* | --- |
* | "We could not find career data for this title yet." |
*
* @param {Aiinsights_Careerdatanotfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_careerdatanotfound4 = /** @type {((inputs?: Aiinsights_Careerdatanotfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Careerdatanotfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_careerdatanotfound4(inputs)
	if (locale === "es") return es_aiinsights_careerdatanotfound4(inputs)
	if (locale === "fr") return fr_aiinsights_careerdatanotfound4(inputs)
	return ar_aiinsights_careerdatanotfound4(inputs)
});
export { aiinsights_careerdatanotfound4 as "aiInsights.careerDataNotFound" }