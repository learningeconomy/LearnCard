/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Salarydatanotfound4Inputs */

const en_aiinsights_salarydatanotfound4 = /** @type {(inputs: Aiinsights_Salarydatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We could not find salary data for this title yet.`)
};

const es_aiinsights_salarydatanotfound4 = /** @type {(inputs: Aiinsights_Salarydatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no encontramos datos salariales para este título.`)
};

const fr_aiinsights_salarydatanotfound4 = /** @type {(inputs: Aiinsights_Salarydatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas encore trouvé de données salariales pour ce titre.`)
};

const ar_aiinsights_salarydatanotfound4 = /** @type {(inputs: Aiinsights_Salarydatanotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من العثور على بيانات رواتب لهذا المسمى بعد.`)
};

/**
* | output |
* | --- |
* | "We could not find salary data for this title yet." |
*
* @param {Aiinsights_Salarydatanotfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_salarydatanotfound4 = /** @type {((inputs?: Aiinsights_Salarydatanotfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Salarydatanotfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_salarydatanotfound4(inputs)
	if (locale === "es") return es_aiinsights_salarydatanotfound4(inputs)
	if (locale === "fr") return fr_aiinsights_salarydatanotfound4(inputs)
	return ar_aiinsights_salarydatanotfound4(inputs)
});
export { aiinsights_salarydatanotfound4 as "aiInsights.salaryDataNotFound" }