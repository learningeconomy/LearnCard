/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Findingqualitativedata3Inputs */

const en_aiinsights_findingqualitativedata3 = /** @type {(inputs: Aiinsights_Findingqualitativedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finding qualitative data...`)
};

const es_aiinsights_findingqualitativedata3 = /** @type {(inputs: Aiinsights_Findingqualitativedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando datos cualitativos...`)
};

const fr_aiinsights_findingqualitativedata3 = /** @type {(inputs: Aiinsights_Findingqualitativedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche de données qualitatives...`)
};

const ar_aiinsights_findingqualitativedata3 = /** @type {(inputs: Aiinsights_Findingqualitativedata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري البحث عن بيانات نوعية`)
};

/**
* | output |
* | --- |
* | "Finding qualitative data..." |
*
* @param {Aiinsights_Findingqualitativedata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_findingqualitativedata3 = /** @type {((inputs?: Aiinsights_Findingqualitativedata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Findingqualitativedata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_findingqualitativedata3(inputs)
	if (locale === "es") return es_aiinsights_findingqualitativedata3(inputs)
	if (locale === "fr") return fr_aiinsights_findingqualitativedata3(inputs)
	return ar_aiinsights_findingqualitativedata3(inputs)
});
export { aiinsights_findingqualitativedata3 as "aiInsights.findingQualitativeData" }