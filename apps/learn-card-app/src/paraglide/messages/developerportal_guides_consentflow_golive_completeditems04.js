/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs */

const en_developerportal_guides_consentflow_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created consent flow contract`)
};

const es_developerportal_guides_consentflow_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de flujo de consentimiento creado`)
};

const fr_developerportal_guides_consentflow_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de flux de consentement créé`)
};

const ar_developerportal_guides_consentflow_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء عقد تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Created consent flow contract" |
*
* @param {Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_golive_completeditems04 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Golive_Completeditems04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_golive_completeditems04(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_golive_completeditems04(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_golive_completeditems04(inputs)
	return ar_developerportal_guides_consentflow_golive_completeditems04(inputs)
});
export { developerportal_guides_consentflow_golive_completeditems04 as "developerPortal.guides.consentFlow.goLive.completedItems0" }