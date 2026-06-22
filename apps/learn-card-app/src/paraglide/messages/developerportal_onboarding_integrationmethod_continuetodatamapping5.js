/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs */

const en_developerportal_onboarding_integrationmethod_continuetodatamapping5 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Data Mapping`)
};

const es_developerportal_onboarding_integrationmethod_continuetodatamapping5 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar al Mapeo de Datos`)
};

const fr_developerportal_onboarding_integrationmethod_continuetodatamapping5 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers le Mapping de Données`)
};

const ar_developerportal_onboarding_integrationmethod_continuetodatamapping5 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتابعة إلى تخطيط البيانات`)
};

/**
* | output |
* | --- |
* | "Continue to Data Mapping" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_continuetodatamapping5 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Continuetodatamapping5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_continuetodatamapping5(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_continuetodatamapping5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_continuetodatamapping5(inputs)
	return ar_developerportal_onboarding_integrationmethod_continuetodatamapping5(inputs)
});
export { developerportal_onboarding_integrationmethod_continuetodatamapping5 as "developerPortal.onboarding.integrationMethod.continueToDataMapping" }