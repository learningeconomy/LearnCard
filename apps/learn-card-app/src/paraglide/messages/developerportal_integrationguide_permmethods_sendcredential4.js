/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs */

const en_developerportal_integrationguide_permmethods_sendcredential4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send VC to wallet`)
};

const es_developerportal_integrationguide_permmethods_sendcredential4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar VC a la billetera`)
};

const fr_developerportal_integrationguide_permmethods_sendcredential4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer VC au portefeuille`)
};

const ar_developerportal_integrationguide_permmethods_sendcredential4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال VC إلى المحفظة`)
};

/**
* | output |
* | --- |
* | "Send VC to wallet" |
*
* @param {Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_sendcredential4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Sendcredential4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_sendcredential4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_sendcredential4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_sendcredential4(inputs)
	return ar_developerportal_integrationguide_permmethods_sendcredential4(inputs)
});
export { developerportal_integrationguide_permmethods_sendcredential4 as "developerPortal.integrationGuide.permMethods.sendCredential" }