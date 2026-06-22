/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Whathappens12Inputs */

const en_developerportal_onboarding_production_whathappens12 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your integration status changes from "setup" to "active"`)
};

const es_developerportal_onboarding_production_whathappens12 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El estado de tu integración cambia de "configuración" a "activo"`)
};

const fr_developerportal_onboarding_production_whathappens12 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le statut de votre intégration passe de "configuration" à "actif"`)
};

const ar_developerportal_onboarding_production_whathappens12 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتغير حالة التكامل الخاص بك من "إعداد" إلى "نشط"`)
};

/**
* | output |
* | --- |
* | "Your integration status changes from \"setup\" to \"active\"" |
*
* @param {Developerportal_Onboarding_Production_Whathappens12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_whathappens12 = /** @type {((inputs?: Developerportal_Onboarding_Production_Whathappens12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Whathappens12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_whathappens12(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_whathappens12(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_whathappens12(inputs)
	return ar_developerportal_onboarding_production_whathappens12(inputs)
});
export { developerportal_onboarding_production_whathappens12 as "developerPortal.onboarding.production.whatHappens1" }