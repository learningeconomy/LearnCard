/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmcheck12Inputs */

const en_developerportal_onboarding_production_confirmcheck12 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure you've tested credential issuance in sandbox`)
};

const es_developerportal_onboarding_production_confirmcheck12 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de haber probado la emisión de credenciales en sandbox`)
};

const fr_developerportal_onboarding_production_confirmcheck12 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous d'avoir testé l'émission de credentials en bac à sable`)
};

const ar_developerportal_onboarding_production_confirmcheck12 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من اختبار إصدار بيانات الاعتماد في بيئة الاختبار`)
};

/**
* | output |
* | --- |
* | "Ensure you've tested credential issuance in sandbox" |
*
* @param {Developerportal_Onboarding_Production_Confirmcheck12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmcheck12 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmcheck12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmcheck12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmcheck12(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmcheck12(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmcheck12(inputs)
	return ar_developerportal_onboarding_production_confirmcheck12(inputs)
});
export { developerportal_onboarding_production_confirmcheck12 as "developerPortal.onboarding.production.confirmCheck1" }