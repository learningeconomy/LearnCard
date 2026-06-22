/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step6desc3Inputs */

const en_developerportal_integrationguide_consent_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`As the contract owner, you can also query consent data and transactions:`)
};

const es_developerportal_integrationguide_consent_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Como propietario del contrato, también puedes consultar datos de consentimiento y transacciones:`)
};

const fr_developerportal_integrationguide_consent_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En tant que propriétaire du contrat, vous pouvez également interroger les données de consentement et les transactions :`)
};

const ar_developerportal_integrationguide_consent_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بصفته مالك العقد، يمكنك أيضاً الاستعلام عن بيانات الموافقة والمعاملات:`)
};

/**
* | output |
* | --- |
* | "As the contract owner, you can also query consent data and transactions:" |
*
* @param {Developerportal_Integrationguide_Consent_Step6desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step6desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step6desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step6desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step6desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step6desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step6desc3(inputs)
	return ar_developerportal_integrationguide_consent_step6desc3(inputs)
});
export { developerportal_integrationguide_consent_step6desc3 as "developerPortal.integrationGuide.consent.step6Desc" }