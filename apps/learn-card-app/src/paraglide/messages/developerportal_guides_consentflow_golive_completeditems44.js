/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs */

const en_developerportal_guides_consentflow_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tested consent flow integration`)
};

const es_developerportal_guides_consentflow_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración de flujo de consentimiento probada`)
};

const fr_developerportal_guides_consentflow_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration du flux de consentement testée`)
};

const ar_developerportal_guides_consentflow_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم اختبار تكامل تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Tested consent flow integration" |
*
* @param {Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_golive_completeditems44 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Golive_Completeditems44Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_golive_completeditems44(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_golive_completeditems44(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_golive_completeditems44(inputs)
	return ar_developerportal_guides_consentflow_golive_completeditems44(inputs)
});
export { developerportal_guides_consentflow_golive_completeditems44 as "developerPortal.guides.consentFlow.goLive.completedItems4" }