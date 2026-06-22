/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs */

const en_developerportal_onboarding_integrationmethod_featurecrossplatform4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Works with most platforms`)
};

const es_developerportal_onboarding_integrationmethod_featurecrossplatform4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Funciona con la mayoría de plataformas`)
};

const fr_developerportal_onboarding_integrationmethod_featurecrossplatform4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctionne avec la plupart des plateformes`)
};

const ar_developerportal_onboarding_integrationmethod_featurecrossplatform4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعمل مع معظم المنصات`)
};

/**
* | output |
* | --- |
* | "Works with most platforms" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurecrossplatform4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurecrossplatform4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurecrossplatform4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurecrossplatform4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurecrossplatform4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurecrossplatform4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurecrossplatform4 as "developerPortal.onboarding.integrationMethod.featureCrossPlatform" }