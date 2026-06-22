/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs */

const en_developerportal_credentialbuilder_evidence_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., A sentiment analysis model trained on movie reviews`)
};

const es_developerportal_credentialbuilder_evidence_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Un modelo de análisis de sentimiento entrenado con reseñas de películas`)
};

const fr_developerportal_credentialbuilder_evidence_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Un modèle d'analyse de sentiment entraîné sur des critiques de films`)
};

const ar_developerportal_credentialbuilder_evidence_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: نموذج تحليل المشاعر المدرب على مراجعات الأفلام`)
};

/**
* | output |
* | --- |
* | "e.g., A sentiment analysis model trained on movie reviews" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_descriptionplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Descriptionplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_descriptionplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_descriptionplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_descriptionplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_evidence_descriptionplaceholder3(inputs)
});
export { developerportal_credentialbuilder_evidence_descriptionplaceholder3 as "developerPortal.credentialBuilder.evidence.descriptionPlaceholder" }