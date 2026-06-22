/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs */

const en_developerportal_guides_consentflow_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created credential templates`)
};

const es_developerportal_guides_consentflow_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas de credenciales creadas`)
};

const fr_developerportal_guides_consentflow_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles de certificats créés`)
};

const ar_developerportal_guides_consentflow_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء قوالب المؤهلات`)
};

/**
* | output |
* | --- |
* | "Created credential templates" |
*
* @param {Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_golive_completeditems34 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Golive_Completeditems34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_golive_completeditems34(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_golive_completeditems34(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_golive_completeditems34(inputs)
	return ar_developerportal_guides_consentflow_golive_completeditems34(inputs)
});
export { developerportal_guides_consentflow_golive_completeditems34 as "developerPortal.guides.consentFlow.goLive.completedItems3" }