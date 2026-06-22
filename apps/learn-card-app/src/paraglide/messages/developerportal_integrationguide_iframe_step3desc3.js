/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step3desc3Inputs */

const en_developerportal_integrationguide_iframe_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up the SDK in your application to communicate with the LearnCard wallet.`)
};

const es_developerportal_integrationguide_iframe_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura el SDK en tu aplicación para comunicarte con la billetera LearnCard.`)
};

const fr_developerportal_integrationguide_iframe_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez le SDK dans votre application pour communiquer avec le portefeuille LearnCard.`)
};

const ar_developerportal_integrationguide_iframe_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد SDK في تطبيقك للتواصل مع محفظة LearnCard.`)
};

/**
* | output |
* | --- |
* | "Set up the SDK in your application to communicate with the LearnCard wallet." |
*
* @param {Developerportal_Integrationguide_Iframe_Step3desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step3desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step3desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step3desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step3desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step3desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step3desc3(inputs)
	return ar_developerportal_integrationguide_iframe_step3desc3(inputs)
});
export { developerportal_integrationguide_iframe_step3desc3 as "developerPortal.integrationGuide.iframe.step3Desc" }