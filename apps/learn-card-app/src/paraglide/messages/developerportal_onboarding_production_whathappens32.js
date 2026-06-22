/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Whathappens32Inputs */

const en_developerportal_onboarding_production_whathappens32 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll be redirected to your integration dashboard to monitor activity`)
};

const es_developerportal_onboarding_production_whathappens32 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Serás redirigido a tu panel de integración para monitorear la actividad`)
};

const fr_developerportal_onboarding_production_whathappens32 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous serez redirigé vers votre tableau de bord d'intégration pour surveiller l'activité`)
};

const ar_developerportal_onboarding_production_whathappens32 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم إعادة توجيهك إلى لوحة معلومات التكامل لمراقبة النشاط`)
};

/**
* | output |
* | --- |
* | "You'll be redirected to your integration dashboard to monitor activity" |
*
* @param {Developerportal_Onboarding_Production_Whathappens32Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_whathappens32 = /** @type {((inputs?: Developerportal_Onboarding_Production_Whathappens32Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Whathappens32Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_whathappens32(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_whathappens32(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_whathappens32(inputs)
	return ar_developerportal_onboarding_production_whathappens32(inputs)
});
export { developerportal_onboarding_production_whathappens32 as "developerPortal.onboarding.production.whatHappens3" }