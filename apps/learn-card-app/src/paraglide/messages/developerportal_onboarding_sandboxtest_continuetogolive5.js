/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs */

const en_developerportal_onboarding_sandboxtest_continuetogolive5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Go Live`)
};

const es_developerportal_onboarding_sandboxtest_continuetogolive5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar a Publicar`)
};

const fr_developerportal_onboarding_sandboxtest_continuetogolive5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers la Mise en Ligne`)
};

const ar_developerportal_onboarding_sandboxtest_continuetogolive5 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتابعة إلى النشر`)
};

/**
* | output |
* | --- |
* | "Continue to Go Live" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_continuetogolive5 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Continuetogolive5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_continuetogolive5(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_continuetogolive5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_continuetogolive5(inputs)
	return ar_developerportal_onboarding_sandboxtest_continuetogolive5(inputs)
});
export { developerportal_onboarding_sandboxtest_continuetogolive5 as "developerPortal.onboarding.sandboxTest.continueToGoLive" }