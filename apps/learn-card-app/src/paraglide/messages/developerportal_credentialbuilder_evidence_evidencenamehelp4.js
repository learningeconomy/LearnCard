/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs */

const en_developerportal_credentialbuilder_evidence_evidencenamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A short title for this piece of evidence`)
};

const es_developerportal_credentialbuilder_evidence_evidencenamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un título corto para esta evidencia`)
};

const fr_developerportal_credentialbuilder_evidence_evidencenamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un titre court pour cette preuve`)
};

const ar_developerportal_credentialbuilder_evidence_evidencenamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان مختصر لهذا الدليل`)
};

/**
* | output |
* | --- |
* | "A short title for this piece of evidence" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidencenamehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidencenamehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidencenamehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidencenamehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidencenamehelp4(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidencenamehelp4(inputs)
});
export { developerportal_credentialbuilder_evidence_evidencenamehelp4 as "developerPortal.credentialBuilder.evidence.evidenceNameHelp" }