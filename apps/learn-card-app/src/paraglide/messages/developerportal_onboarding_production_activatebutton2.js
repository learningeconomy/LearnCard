/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Activatebutton2Inputs */

const en_developerportal_onboarding_production_activatebutton2 = /** @type {(inputs: Developerportal_Onboarding_Production_Activatebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activate Production Mode`)
};

const es_developerportal_onboarding_production_activatebutton2 = /** @type {(inputs: Developerportal_Onboarding_Production_Activatebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activar Modo de Producción`)
};

const fr_developerportal_onboarding_production_activatebutton2 = /** @type {(inputs: Developerportal_Onboarding_Production_Activatebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activer le Mode Production`)
};

const ar_developerportal_onboarding_production_activatebutton2 = /** @type {(inputs: Developerportal_Onboarding_Production_Activatebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنشيط وضع الإنتاج`)
};

/**
* | output |
* | --- |
* | "Activate Production Mode" |
*
* @param {Developerportal_Onboarding_Production_Activatebutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_activatebutton2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Activatebutton2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Activatebutton2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_activatebutton2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_activatebutton2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_activatebutton2(inputs)
	return ar_developerportal_onboarding_production_activatebutton2(inputs)
});
export { developerportal_onboarding_production_activatebutton2 as "developerPortal.onboarding.production.activateButton" }