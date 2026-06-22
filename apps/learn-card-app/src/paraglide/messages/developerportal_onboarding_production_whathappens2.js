/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Whathappens2Inputs */

const en_developerportal_onboarding_production_whathappens2 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What happens when you go live?`)
};

const es_developerportal_onboarding_production_whathappens2 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué sucede cuando publicas?`)
};

const fr_developerportal_onboarding_production_whathappens2 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que se passe-t-il lorsque vous passez en production ?`)
};

const ar_developerportal_onboarding_production_whathappens2 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا يحدث عند النشر؟`)
};

/**
* | output |
* | --- |
* | "What happens when you go live?" |
*
* @param {Developerportal_Onboarding_Production_Whathappens2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_whathappens2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Whathappens2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Whathappens2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_whathappens2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_whathappens2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_whathappens2(inputs)
	return ar_developerportal_onboarding_production_whathappens2(inputs)
});
export { developerportal_onboarding_production_whathappens2 as "developerPortal.onboarding.production.whatHappens" }