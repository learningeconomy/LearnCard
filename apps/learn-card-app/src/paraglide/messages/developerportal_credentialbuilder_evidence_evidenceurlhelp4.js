/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs */

const en_developerportal_credentialbuilder_evidence_evidenceurlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link to the evidence artifact (webpage, file, portfolio)`)
};

const es_developerportal_credentialbuilder_evidence_evidenceurlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace al artefacto de evidencia (página web, archivo, portafolio)`)
};

const fr_developerportal_credentialbuilder_evidence_evidenceurlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien vers l'artefact de preuve (page web, fichier, portfolio)`)
};

const ar_developerportal_credentialbuilder_evidence_evidenceurlhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط إلى مستند الدليل (صفحة ويب، ملف، محفظة)`)
};

/**
* | output |
* | --- |
* | "Link to the evidence artifact (webpage, file, portfolio)" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidenceurlhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidenceurlhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidenceurlhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidenceurlhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidenceurlhelp4(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidenceurlhelp4(inputs)
});
export { developerportal_credentialbuilder_evidence_evidenceurlhelp4 as "developerPortal.credentialBuilder.evidence.evidenceUrlHelp" }