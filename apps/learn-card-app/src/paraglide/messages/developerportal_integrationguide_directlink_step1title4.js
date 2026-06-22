/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step1title4Inputs */

const en_developerportal_integrationguide_directlink_step1title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure Your Redirect URL`)
};

const es_developerportal_integrationguide_directlink_step1title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura tu URL de Redirección`)
};

const fr_developerportal_integrationguide_directlink_step1title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer Votre URL de Redirection`)
};

const ar_developerportal_integrationguide_directlink_step1title4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين عنوان URL لإعادة التوجيه`)
};

/**
* | output |
* | --- |
* | "Configure Your Redirect URL" |
*
* @param {Developerportal_Integrationguide_Directlink_Step1title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step1title4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step1title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step1title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step1title4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step1title4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step1title4(inputs)
	return ar_developerportal_integrationguide_directlink_step1title4(inputs)
});
export { developerportal_integrationguide_directlink_step1title4 as "developerPortal.integrationGuide.directLink.step1Title" }