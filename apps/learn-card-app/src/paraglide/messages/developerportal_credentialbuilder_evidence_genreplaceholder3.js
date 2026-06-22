/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs */

const en_developerportal_credentialbuilder_evidence_genreplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Portfolio, Film`)
};

const es_developerportal_credentialbuilder_evidence_genreplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Portafolio, Película`)
};

const fr_developerportal_credentialbuilder_evidence_genreplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Portfolio, Film`)
};

const ar_developerportal_credentialbuilder_evidence_genreplaceholder3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: محفظة، فيلم`)
};

/**
* | output |
* | --- |
* | "e.g., Portfolio, Film" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_genreplaceholder3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Genreplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_genreplaceholder3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_genreplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_genreplaceholder3(inputs)
	return ar_developerportal_credentialbuilder_evidence_genreplaceholder3(inputs)
});
export { developerportal_credentialbuilder_evidence_genreplaceholder3 as "developerPortal.credentialBuilder.evidence.genrePlaceholder" }