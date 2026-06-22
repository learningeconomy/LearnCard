/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs */

const en_developerportal_integrationguide_permmethods_credentialbyid5 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get specific credential`)
};

const es_developerportal_integrationguide_permmethods_credentialbyid5 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener credencial específica`)
};

const fr_developerportal_integrationguide_permmethods_credentialbyid5 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir un identifiant spécifique`)
};

const ar_developerportal_integrationguide_permmethods_credentialbyid5 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على بيانات اعتماد محددة`)
};

/**
* | output |
* | --- |
* | "Get specific credential" |
*
* @param {Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_credentialbyid5 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Credentialbyid5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_credentialbyid5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_credentialbyid5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_credentialbyid5(inputs)
	return ar_developerportal_integrationguide_permmethods_credentialbyid5(inputs)
});
export { developerportal_integrationguide_permmethods_credentialbyid5 as "developerPortal.integrationGuide.permMethods.credentialById" }