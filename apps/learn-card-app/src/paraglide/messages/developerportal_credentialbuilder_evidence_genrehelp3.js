/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs */

const en_developerportal_credentialbuilder_evidence_genrehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The format or medium of the evidence`)
};

const es_developerportal_credentialbuilder_evidence_genrehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El formato o medio de la evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_genrehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le format ou le support de la preuve`)
};

const ar_developerportal_credentialbuilder_evidence_genrehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنسيق أو وسيلة الدليل`)
};

/**
* | output |
* | --- |
* | "The format or medium of the evidence" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_genrehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Genrehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_genrehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_genrehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_genrehelp3(inputs)
	return ar_developerportal_credentialbuilder_evidence_genrehelp3(inputs)
});
export { developerportal_credentialbuilder_evidence_genrehelp3 as "developerPortal.credentialBuilder.evidence.genreHelp" }