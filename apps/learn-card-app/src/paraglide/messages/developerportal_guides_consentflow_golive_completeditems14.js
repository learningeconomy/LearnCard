/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs */

const en_developerportal_guides_consentflow_golive_completeditems14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up redirect handler`)
};

const es_developerportal_guides_consentflow_golive_completeditems14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejador de redirección configurado`)
};

const fr_developerportal_guides_consentflow_golive_completeditems14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de redirection configuré`)
};

const ar_developerportal_guides_consentflow_golive_completeditems14 = /** @type {(inputs: Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد معالج إعادة التوجيه`)
};

/**
* | output |
* | --- |
* | "Set up redirect handler" |
*
* @param {Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_golive_completeditems14 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Golive_Completeditems14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_golive_completeditems14(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_golive_completeditems14(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_golive_completeditems14(inputs)
	return ar_developerportal_guides_consentflow_golive_completeditems14(inputs)
});
export { developerportal_guides_consentflow_golive_completeditems14 as "developerPortal.guides.consentFlow.goLive.completedItems1" }