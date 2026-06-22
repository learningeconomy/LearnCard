/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Setupcomplete2Inputs */

const en_developerportal_onboarding_production_setupcomplete2 = /** @type {(inputs: Developerportal_Onboarding_Production_Setupcomplete2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup Complete`)
};

const es_developerportal_onboarding_production_setupcomplete2 = /** @type {(inputs: Developerportal_Onboarding_Production_Setupcomplete2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Completa`)
};

const fr_developerportal_onboarding_production_setupcomplete2 = /** @type {(inputs: Developerportal_Onboarding_Production_Setupcomplete2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Terminée`)
};

const ar_developerportal_onboarding_production_setupcomplete2 = /** @type {(inputs: Developerportal_Onboarding_Production_Setupcomplete2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإعداد مكتمل`)
};

/**
* | output |
* | --- |
* | "Setup Complete" |
*
* @param {Developerportal_Onboarding_Production_Setupcomplete2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_setupcomplete2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Setupcomplete2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Setupcomplete2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_setupcomplete2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_setupcomplete2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_setupcomplete2(inputs)
	return ar_developerportal_onboarding_production_setupcomplete2(inputs)
});
export { developerportal_onboarding_production_setupcomplete2 as "developerPortal.onboarding.production.setupComplete" }