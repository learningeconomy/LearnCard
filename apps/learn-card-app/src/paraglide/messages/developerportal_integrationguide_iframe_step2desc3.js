/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step2desc3Inputs */

const en_developerportal_integrationguide_iframe_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install the LearnCard Partner Connect SDK to communicate with the wallet.`)
};

const es_developerportal_integrationguide_iframe_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala el SDK de Partner Connect de LearnCard para comunicarte con la billetera.`)
};

const fr_developerportal_integrationguide_iframe_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installez le SDK Partner Connect de LearnCard pour communiquer avec le portefeuille.`)
};

const ar_developerportal_integrationguide_iframe_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتثبيت LearnCard Partner Connect SDK للتواصل مع المحفظة.`)
};

/**
* | output |
* | --- |
* | "Install the LearnCard Partner Connect SDK to communicate with the wallet." |
*
* @param {Developerportal_Integrationguide_Iframe_Step2desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step2desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step2desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step2desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step2desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step2desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step2desc3(inputs)
	return ar_developerportal_integrationguide_iframe_step2desc3(inputs)
});
export { developerportal_integrationguide_iframe_step2desc3 as "developerPortal.integrationGuide.iframe.step2Desc" }