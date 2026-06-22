/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs */

const en_developerportal_integrationguide_iframe_apirefrowsendcred6 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send VC to user's wallet`)
};

const es_developerportal_integrationguide_iframe_apirefrowsendcred6 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar VC a la billetera del usuario`)
};

const fr_developerportal_integrationguide_iframe_apirefrowsendcred6 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer VC au portefeuille de l'utilisateur`)
};

const ar_developerportal_integrationguide_iframe_apirefrowsendcred6 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال VC إلى محفظة المستخدم`)
};

/**
* | output |
* | --- |
* | "Send VC to user's wallet" |
*
* @param {Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apirefrowsendcred6 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apirefrowsendcred6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apirefrowsendcred6(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apirefrowsendcred6(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apirefrowsendcred6(inputs)
	return ar_developerportal_integrationguide_iframe_apirefrowsendcred6(inputs)
});
export { developerportal_integrationguide_iframe_apirefrowsendcred6 as "developerPortal.integrationGuide.iframe.apiRefRowSendCred" }