/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs */

const en_developerportal_credentialbuilder_evidence_evidencetypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OBv3 type identifier (usually 'Evidence')`)
};

const es_developerportal_credentialbuilder_evidence_evidencetypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificador de tipo OBv3 (generalmente 'Evidence')`)
};

const fr_developerportal_credentialbuilder_evidence_evidencetypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant de type OBv3 (généralement 'Evidence')`)
};

const ar_developerportal_credentialbuilder_evidence_evidencetypehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف نوع OBv3 (عادة 'Evidence')`)
};

/**
* | output |
* | --- |
* | "OBv3 type identifier (usually 'Evidence')" |
*
* @param {Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_evidence_evidencetypehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Evidence_Evidencetypehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_evidence_evidencetypehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_evidence_evidencetypehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_evidence_evidencetypehelp4(inputs)
	return ar_developerportal_credentialbuilder_evidence_evidencetypehelp4(inputs)
});
export { developerportal_credentialbuilder_evidence_evidencetypehelp4 as "developerPortal.credentialBuilder.evidence.evidenceTypeHelp" }