/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs */

const en_developerportal_credentialbuilder_evidence_narrativehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A narrative describing the evidence and how it was produced (supports Markdown)`)
};

const es_developerportal_credentialbuilder_evidence_narrativehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una narrativa que describe la evidencia y cómo se produjo (soporta Markdown)`)
};

const fr_developerportal_credentialbuilder_evidence_narrativehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un récit décrivant la preuve et comment elle a été produite (supporte Markdown)`)
};

const ar_developerportal_credentialbuilder_evidence_narrativehelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سرد يصف الدليل وكيف تم إنتاجه (يدعم Markdown)`)
};

/**
* | output |
* | --- |
* | "A narrative describing the evidence and how it was produced (supports Markdown)" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_narrativehelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Narrativehelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_narrativehelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_narrativehelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_narrativehelp3(inputs)
	return ar_developerportal_credentialbuilder_evidence_narrativehelp3(inputs)
});
export { developerportal_credentialbuilder_evidence_narrativehelp3 as "developerPortal.credentialBuilder.evidence.narrativeHelp" }