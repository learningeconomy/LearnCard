/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs */

const en_developerportal_guides_embedclaim_teststep_completechecks4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete all pre-flight checks above to see a live preview of the claim button.`)
};

const es_developerportal_guides_embedclaim_teststep_completechecks4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa todas las verificaciones previas para ver una vista previa en vivo del botón de reclamo.`)
};

const fr_developerportal_guides_embedclaim_teststep_completechecks4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effectuez toutes les vérifications préalables ci-dessus pour voir un aperçu en direct du bouton de réclamation.`)
};

const ar_developerportal_guides_embedclaim_teststep_completechecks4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل جميع الفحوصات المسبقة أعلاه لرؤية معاينة حية لزر المطالبة.`)
};

/**
* | output |
* | --- |
* | "Complete all pre-flight checks above to see a live preview of the claim button." |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_completechecks4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Completechecks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_completechecks4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_completechecks4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_completechecks4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_completechecks4(inputs)
});
export { developerportal_guides_embedclaim_teststep_completechecks4 as "developerPortal.guides.embedClaim.testStep.completeChecks" }