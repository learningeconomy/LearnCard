/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step1desc3Inputs */

const en_developerportal_integrationguide_iframe_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and host a website that can be embedded in an iframe. You'll need to configure CORS headers.`)
};

const es_developerportal_integrationguide_iframe_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea y aloja un sitio web que pueda ser incrustado en un iframe. Necesitarás configurar los encabezados CORS.`)
};

const fr_developerportal_integrationguide_iframe_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez et hébergez un site web qui peut être intégré dans une iframe. Vous devrez configurer les en-têtes CORS.`)
};

const ar_developerportal_integrationguide_iframe_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واستضف موقع ويب يمكن تضمينه في iframe. ستحتاج إلى تكوين رؤوس CORS.`)
};

/**
* | output |
* | --- |
* | "Create and host a website that can be embedded in an iframe. You'll need to configure CORS headers." |
*
* @param {Developerportal_Integrationguide_Iframe_Step1desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step1desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step1desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step1desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step1desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step1desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step1desc3(inputs)
	return ar_developerportal_integrationguide_iframe_step1desc3(inputs)
});
export { developerportal_integrationguide_iframe_step1desc3 as "developerPortal.integrationGuide.iframe.step1Desc" }