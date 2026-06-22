/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs */

const en_developerportal_integrationguide_permmethods_requestidentity4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returns user DID & profile`)
};

const es_developerportal_integrationguide_permmethods_requestidentity4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devuelve DID y perfil del usuario`)
};

const fr_developerportal_integrationguide_permmethods_requestidentity4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourne le DID et le profil de l'utilisateur`)
};

const ar_developerportal_integrationguide_permmethods_requestidentity4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرجاع DID وملف المستخدم الشخصي`)
};

/**
* | output |
* | --- |
* | "Returns user DID & profile" |
*
* @param {Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_requestidentity4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Requestidentity4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_requestidentity4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_requestidentity4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_requestidentity4(inputs)
	return ar_developerportal_integrationguide_permmethods_requestidentity4(inputs)
});
export { developerportal_integrationguide_permmethods_requestidentity4 as "developerPortal.integrationGuide.permMethods.requestIdentity" }