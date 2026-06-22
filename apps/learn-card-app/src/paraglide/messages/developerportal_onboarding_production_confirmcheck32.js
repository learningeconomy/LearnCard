/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmcheck32Inputs */

const en_developerportal_onboarding_production_confirmcheck32 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm your branding and templates are finalized`)
};

const es_developerportal_onboarding_production_confirmcheck32 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirma que tu marca y plantillas estén finalizadas`)
};

const fr_developerportal_onboarding_production_confirmcheck32 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmez que votre image de marque et vos modèles sont finalisés`)
};

const ar_developerportal_onboarding_production_confirmcheck32 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن علامتك التجارية وقوالبك نهائية`)
};

/**
* | output |
* | --- |
* | "Confirm your branding and templates are finalized" |
*
* @param {Developerportal_Onboarding_Production_Confirmcheck32Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmcheck32 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmcheck32Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmcheck32Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmcheck32(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmcheck32(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmcheck32(inputs)
	return ar_developerportal_onboarding_production_confirmcheck32(inputs)
});
export { developerportal_onboarding_production_confirmcheck32 as "developerPortal.onboarding.production.confirmCheck3" }